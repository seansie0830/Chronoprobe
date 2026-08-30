# ⏱️ Chronoprobe — Cryptographic Time-Interval Proofing System (PoC)

Chronoprobe is a decentralized, verifiable time-interval proofing system built with **Foundry**, **Vite + React**, **Wagmi / Viem**, and styled as a modern **Discord Web3 Chat Application**.

---

## 🔒 Cryptographic Mechanism

1. **Authorship & Non-Repudiation (Digital Signature / ECDSA)**:
   $$\text{Sig} = \text{Sign}_{PrivKey}(\text{DataHash} \parallel B_{start} \parallel \text{BlockHash}_{start})$$
   Proves author identity and prevents forged assertions.
2. **Lower Bound ($t > t_{start}$)**:
   Commits to the unpredictable `blockhash(B_start)` mined on the blockchain. The signature could not have existed before $B_{start}$.
3. **Upper Bound ($t < t_{end}$)**:
   Batches certified messages into an **OpenZeppelin-compatible Merkle Tree** and anchors the Merkle Root on-chain at block $B_{end}$ via `Chronoprobe.sol`.
4. **Interval Proof**:
   $$\text{Verified: } B_{start} < B_{data} < B_{end}$$

---

## 🚀 Project Architecture

- **`contracts/`**: Foundry smart contract suite (`Chronoprobe.sol`), OpenZeppelin MerkleProof verifier, EIP-712/ECDSA assertions, and unit tests (`forge test -vvv`).
- **`frontend/`**: Vite + React 19 + TypeScript + Wagmi v2 + React Router + Tailwind CSS.
  - `/chat?id=<channel>`: Discord-style chat channels with real-time assertion signing and batch anchoring.
  - `/inspect?leaf=...&root=...`: VS Code-style **Folder Tree / File Explorer Merkle Inspector**.
  - `/settings`: Client-side persona & keypair management (custom seeds or fresh random generation).
  - `/export`: Export full cryptographically verified JSON bundles.
  - `/import`: Import and restore conversation histories & proof receipts.

---

## 🛠️ Quick Start

### 1. Smart Contracts (Foundry)
```bash
cd contracts
forge test -vvv
```

### 2. Local Blockchain & Deployment (Anvil)
```bash
# Start local node
anvil --port 8545

# Deploy Chronoprobe contract
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

### 3. Frontend (pnpm)
```bash
cd frontend
pnpm install
pnpm dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Testnet Deployment (Sepolia / Base Sepolia)
1. Copy `.env.example` to `.env` and fill in `PRIVATE_KEY`, `RPC_URL`, and `ETHERSCAN_API_KEY`.
2. Run:
```bash
cd contracts
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
```
3. Update the contract address in `/settings` in the frontend.
