
# OptiFlo Layer 2 Scaling Solution

A Layer 2 scaling solution using Optimistic Rollups with off-chain transaction execution and on-chain state verification.

## Project Structure

- **Frontend**: React + Vite application
- **Smart Contract**: Solidity contract for the Layer 2 protocol

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

## Additional Information

- The contract address is configured in `src/utils/ethers.ts`
- Local backend API server is expected to run on port 5500

## Backend Development (Optional)

To fully implement the Layer 2 solution, you'll need a backend server to:
- Process off-chain transactions
- Submit batches to the contract
- Manage the state tree

A simple Express server can be implemented to handle these operations.
