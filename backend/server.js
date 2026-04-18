require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// ── RPC Config (Regtest defaults) ──────────────────────────────────────────
const RPC = {
  host: process.env.RPC_HOST,
  port: process.env.RPC_PORT,
  user: process.env.RPC_USER,
  pass: process.env.RPC_PASS,
};

async function rpc(method, params = [], wallet = null) {
  const url = wallet
    ? `http://${RPC.host}:${RPC.port}/wallet/${wallet}`
    : `http://${RPC.host}:${RPC.port}`;
  const { data } = await axios.post(
    url,
    { jsonrpc: '1.0', id: 'btc-lab', method, params },
    {
      auth: { username: RPC.user, password: RPC.pass },
      headers: { 'Content-Type': 'application/json' },
    }
  );
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

// ── Generic CLI passthrough ───────────────────────────────────────────────
app.post('/api/cli', async (req, res) => {
  const { command, wallet } = req.body;
  if (!command || !command.trim()) return res.json({ error: 'Empty command' });

  const parts = command.trim().split(/\s+/);
  const method = parts[0];

  // Parse params: try JSON first, fallback to raw string
  const params = parts.slice(1).map((p) => {
    try { return JSON.parse(p); } catch { return p; }
  });

  try {
    const result = await rpc(method, params, wallet || null);
    res.json({ result });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// ── Blockchain Info ───────────────────────────────────────────────────────
app.get('/api/blockchain', async (req, res) => {
  try {
    const [info, mempool] = await Promise.all([
      rpc('getblockchaininfo'),
      rpc('getmempoolinfo'),
    ]);
    res.json({ info, mempool });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Recent Blocks ─────────────────────────────────────────────────────────
app.get('/api/blocks', async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 10;
    const bestHash = await rpc('getbestblockhash');
    const blocks = [];
    let hash = bestHash;
    for (let i = 0; i < count && hash; i++) {
      const b = await rpc('getblock', [hash, 1]);
      blocks.push({
        height: b.height, hash: b.hash, time: b.time,
        txCount: b.nTx, size: b.size, weight: b.weight,
        difficulty: b.difficulty, miner: b.miner || 'Unknown',
      });
      hash = b.previousblockhash;
    }
    res.json(blocks);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Block Detail ──────────────────────────────────────────────────────────
app.get('/api/block/:hashOrHeight', async (req, res) => {
  try {
    let hash = req.params.hashOrHeight;
    if (/^\d+$/.test(hash)) hash = await rpc('getblockhash', [parseInt(hash)]);
    const block = await rpc('getblock', [hash, 2]);
    res.json(block);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Mempool Transactions ───────────────────────────────────────────────────
app.get('/api/mempool', async (req, res) => {
  try {
    const txids = await rpc('getrawmempool', [false]);
    const limit = Math.min(txids.length, 20);
    const txs = [];
    for (let i = 0; i < limit; i++) {
      try {
        const entry = await rpc('getmempoolentry', [txids[i]]);
        txs.push({ txid: txids[i], ...entry });
      } catch { /* skip */ }
    }
    res.json({ count: txids.length, transactions: txs });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Transaction Lookup ─────────────────────────────────────────────────────
app.get('/api/tx/:txid', async (req, res) => {
  try {
    const raw = await rpc('getrawtransaction', [req.params.txid, true]);
    res.json(raw);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── List Wallets ───────────────────────────────────────────────────────────
app.get('/api/wallets', async (req, res) => {
  try {
    const wallets = await rpc('listwallets');
    res.json(wallets);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Create Wallet ──────────────────────────────────────────────────────────
app.post('/api/wallet/create', async (req, res) => {
  const { name } = req.body;
  try {
    const result = await rpc('createwallet', [name]);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Wallet Info ────────────────────────────────────────────────────────────
app.get('/api/wallet/:name/info', async (req, res) => {
  const w = req.params.name;
  try {
    const [balance, info, addresses] = await Promise.all([
      rpc('getbalance', [], w),
      rpc('getwalletinfo', [], w),
      rpc('listreceivedbyaddress', [0, true], w),
    ]);
    res.json({ balance, info, addresses });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── New Address ────────────────────────────────────────────────────────────
app.post('/api/wallet/:name/newaddress', async (req, res) => {
  const { label } = req.body;
  try {
    const address = await rpc('getnewaddress', [label || ''], req.params.name);
    res.json({ address });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Transaction History ────────────────────────────────────────────────────
app.get('/api/wallet/:name/transactions', async (req, res) => {
  const count = parseInt(req.query.count) || 20;
  try {
    const txs = await rpc('listtransactions', ['*', count, 0, true], req.params.name);
    res.json(txs.reverse());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── UTXOs ──────────────────────────────────────────────────────────────────
app.get('/api/wallet/:name/utxos', async (req, res) => {
  try {
    const utxos = await rpc('listunspent', [], req.params.name);
    res.json(utxos);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Send Bitcoin ───────────────────────────────────────────────────────────
app.post('/api/wallet/:name/send', async (req, res) => {
  const { address, amount, comment } = req.body;
  try {
    // Use explicit 1 sat/vB fee rate for regtest compatibility
    const txid = await rpc(
      'sendtoaddress',
      [address, parseFloat(amount), comment || '', '', false, false, null, 'unset', false, 1],
      req.params.name
    );
    res.json({ txid });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Mine Blocks (Regtest) ──────────────────────────────────────────────────
app.post('/api/mine', async (req, res) => {
  const { blocks, wallet } = req.body;
  try {
    const address = await rpc('getnewaddress', [], wallet);
    const hashes = await rpc('generatetoaddress', [parseInt(blocks) || 1, address]);
    res.json({ blocks: hashes.length, hashes, address });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Network Info ───────────────────────────────────────────────────────────
app.get('/api/network', async (req, res) => {
  try {
    const [netinfo, peerinfo] = await Promise.all([
      rpc('getnetworkinfo'),
      rpc('getpeerinfo'),
    ]);
    res.json({ netinfo, peerinfo });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Health Check ───────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    const info = await rpc('getblockchaininfo');
    res.json({ status: 'connected', chain: info.chain, blocks: info.blocks });
  } catch (e) { res.json({ status: 'disconnected', error: e.message }); }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Bitcoin Lab Backend running on http://localhost:${PORT}`));
