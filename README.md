## Getting Started

### To download all project dependencies, run:

```bash
npm install
```

### Start the local development blockchain network via:

```bash
npx hardhat node
```

### <strong>IMPORTANT: Import one of the contract addresses to Metamask </strong>

### In a different terminal instance, run the following command to deploy the SimpleCoinGuessGame smart contract to the local blockchain network:

```bash
./src/scripts/deploy.ts --network localhost
```
### Extract the deployed contract address from the previous terminal instance (where the local network is running) and enter it as the value of the contract address variable in:

```bash
Coin-Guesser/src/contractconfig.ts
```
### In a separate terminal, run:

```bash
npm run dev
```
### Once running, open: http://localhost:3000 (or whatever specified port)

### Press Start Game to connect your wallet to MetaMask

### Start Guessing!
