# ₿ Bitcoin Regtest Lab

A local Bitcoin development environment where you can explore blocks, manage wallets, send transactions, and mine blocks — all in one place.

---

## 🚀 What this is

This project is a **full-stack Bitcoin regtest sandbox** built to understand how Bitcoin works under the hood.

It includes:

* a simple **block explorer**
* a **wallet interface**
* **mempool + transaction tracking**
* a **CLI-style interaction layer**

---

## ⚙️ Features

* 📊 View blockchain info (blocks, difficulty, mempool)
* 🔍 Explore blocks and transactions
* 💼 Create and manage wallets
* 📤 Send & receive Bitcoin (regtest)
* ⛏️ Mine blocks instantly
* 🧱 View UTXOs
* ⌨️ Run Bitcoin RPC commands from the UI

---

## 🛠️ Tech

* **Frontend:** HTML, CSS, JavaScript
* **Backend:** Node.js + Express
* **Blockchain:** Bitcoin Core (Regtest)
* **RPC:** JSON-RPC

---

## 📸 Screenshots

### Dashboard

![Dashboard](assets/Dashboard.png)

### Explorer

![Explorer](assets/Explorer.png)

### Wallet

![Wallet](assets/wallet.png)

### Send Transaction

![Send](assets/send.png)

### Mempool

![Mempool](assets/mempool.png)

---

## 🧪 Running Locally

### 🔧 Prerequisites

* Node.js (v16+)
* Bitcoin Core installed

---

## 1️⃣ Install Bitcoin Core

Download from the official site:
👉 https://bitcoincore.org/en/download/

Install it on your system.

---

## 2️⃣ Create Bitcoin Config File

Create a file named `bitcoin.conf` inside your data directory
(e.g., `D:\ProgramFiles\Bitcoin\data`)

Make sure the file is saved with a `.conf` extension.

Add the following:

```conf
# Global settings
server=1
txindex=1

[regtest]
rpcuser=bitcoin
rpcpassword=bitcoin123
rpcport=18443
rpcallowip=127.0.0.1
```

(Optional) If transactions fail due to fee estimation, add:

```conf
fallbackfee=0.0001
```

This is only for regtest and should not be used in production.

---

## 3️⃣ Start Bitcoin in Regtest Mode

Update the paths according to your installation and run:

Press win+R and then run this command
```bash
D:\file-path\bitcoin-qt.exe --regtest -datadir=D:\file-path\data
```

This starts a local Bitcoin node in **regtest mode**.

---

## 4️⃣ Configure Backend Environment

Create a `.env` file inside the `backend/` folder:

```env
RPC_HOST=127.0.0.1
RPC_PORT=18443
RPC_USER=bitcoin
RPC_PASS=bitcoin123
```

These values must match your `bitcoin.conf` file.

💡 Note:
The `.env` file is not included in the repository.
Refer to `.env.example` for the required structure.

---

## 5️⃣ Start Backend Server

```bash
cd backend
npm install
npm start
```

You should see:

```
Bitcoin Lab Backend running on http://localhost:3001
```

---

## 6️⃣ Open the Frontend

Open this file in your browser:

```text
frontend/index.html
```

---

## 7️⃣ First-Time Setup

* Create a wallet from the UI
* Mine at least **101 blocks** to get usable balance
* You can now:

  * send transactions
  * explore blocks
  * view the mempool

---

## ⚠️ Notes

* Works only on **Bitcoin Regtest**
* Ensure both the backend and Bitcoin node are running simultaneously
* RPC credentials must match `bitcoin.conf`

---

## 🌐 Running on Testnet (Optional)

This project can also be used with the **Bitcoin Testnet** instead of Regtest.

However, unlike Regtest, Testnet requires syncing the blockchain, which can take significant time.

---

### ⏳ Initial Setup Time

* Full sync: **5–15 days** (depending on system and network speed)
* Disk space required:

  * Full node: ~**100–150 GB**
  * Pruned node: ~**5–10 GB** (recommended)

---

### ⚙️ Testnet Configuration

Update your `bitcoin.conf`:

```conf
server=1
txindex=1

[test]
rpcuser=bitcoin
rpcpassword=bitcoin123
rpcport=18332
rpcallowip=127.0.0.1
```

(Optional) To reduce storage usage, you can enable pruning:

```conf
prune=550
```

---

### ▶️ Start Bitcoin in Testnet Mode

```bash
bitcoin-qt.exe -testnet
```

Or with a custom data directory:

```bash
bitcoin-qt.exe -testnet -datadir=D:\file-path\data
```

---

### 🔧 Backend Changes

Update your `.env` file:

```env
RPC_PORT=18332
```

No other changes are required if your backend uses environment variables.

---

### ⚠️ Limitations on Testnet

* Mining RPC calls (e.g., `generatetoaddress`) are only available in regtest
* The `/api/mine` endpoint will not work on testnet
* Coins must be obtained using **testnet faucets**
* Transaction confirmations are slower compared to regtest
* Performance may be slower due to real network conditions

---

### 💡 Recommendation

For learning and experimentation, **Regtest is strongly recommended**.
Testnet is useful if you want to simulate a more realistic network environment.

---

## 👤 Author

Atif Azeem

---

## 💭 thoughts

* built this to understand how bitcoin actually works instead of just reading theory
* still improving it as i learn more

---
