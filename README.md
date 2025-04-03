
# OptiFlo Layer 2 Scaling Solution

A Layer 2 scaling solution using Optimistic Rollups with off-chain transaction execution and on-chain state verification.

## Project Structure

- **Frontend**: React + Vite application for user interface
- **Smart Contract**: Solidity contract for the Layer 2 protocol
- **Off-Chain Components**: JavaScript service for L2 state management

## Key Components

### On-Chain (Smart Contract)
- Batch submission mechanism
- Fraud proof verification
- Challenge period (1 week)
- Merkle tree verification
- Deposit and withdrawal functions

### Off-Chain (JavaScript)
- Transaction pool management
- Merkle tree generation
- Batch creation
- State persistence
- Fraud proof generation

## Local Development Setup

### Prerequisites

1. Node.js (v16+ recommended)
2. MetaMask browser extension
3. Hardhat or other Ethereum development environment

### Smart Contract Setup

1. Clone the contract repository (or create a new directory)
   ```
   mkdir optiflo-contracts
   cd optiflo-contracts
   ```

2. Initialize a new Hardhat project
   ```
   npm init -y
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   npx hardhat init
   ```

3. Copy your OptiFlo contract to the `contracts` directory
   ```
   cp /path/to/OptiFlo.sol ./contracts/
   ```

4. Deploy the contract locally
   ```
   npx hardhat node
   ```

5. In a new terminal, deploy the contract to the local network
   ```
   npx hardhat run scripts/deploy.js --network localhost
   ```

6. Copy the deployed contract address and update it in `src/utils/ethers.ts`

### Frontend Setup

1. Clone the frontend repository
   ```
   git clone <repository-url>
   cd optiflo-frontend
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the development server
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:8080`

## Usage

1. Connect your MetaMask to the local Hardhat network (usually http://localhost:8545)
2. Import one of the test accounts from Hardhat into MetaMask using the private key
3. Use the application to interact with the Layer 2 solution

### Off-Chain Transactions

1. Connect your wallet
2. Use the "Off-Chain Transaction" component to send L2 transactions
3. Transactions are stored in a local pending pool
4. When ready, batch the transactions to submit to the L1 contract
5. After the challenge period, finalize the batch

### Fraud Proofs

1. Navigate to the Admin page
2. Select a batch to examine
3. If fraud is detected, submit a fraud proof with the necessary Merkle proof
4. The contract will verify and slash the submitter if no fraud is found

## Additional Information

- The contract address is configured in `src/utils/ethers.ts`
- Off-chain state is persisted to localStorage in this demo
- In production, a proper database and server would be used

## Layer 2 Architecture

This implementation follows the Optimistic Rollup pattern:

1. Transactions are executed off-chain
2. Transaction batches are committed to L1 as Merkle roots
3. A challenge period allows for fraud proofs
4. After the challenge period, batches are finalized
5. State transitions are considered final after finalization
