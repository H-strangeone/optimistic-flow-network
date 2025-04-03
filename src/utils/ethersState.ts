
import { ethers } from "ethers";

// Shared state object accessible by all modules
export const ethersState = {
  provider: null as ethers.Provider | null,
  signer: null as ethers.Signer | null,
  contract: null as ethers.Contract | null,
  account: "",
  chainId: "",
  balance: "0",
  l2Balance: "0",
  isConnected: false,
  isLoading: false,
};

// Layer 2 contract interface
export const contractABI = [
  "function submitBatch(bytes32[] memory _transactionsRoots) external",
  "function verifyBatch(uint256 _batchId) external",
  "function reportFraud(uint256 _batchId, bytes32 _fraudProof, tuple(address sender, address recipient, uint256 amount) memory _tx, bytes32[] memory _merkleProof) external",
  "function finalizeBatch(uint256 _batchId) external",
  "function depositFunds() external payable",
  "function withdrawFunds(uint256 _amount) external",
  "function batchTransfer(address[] memory recipients, uint256[] memory amounts) external payable",
  "function balances(address) external view returns (uint256)",
  "function batches(uint256) external view returns (uint256 batchId, bytes32 transactionsRoot, uint256 timestamp, bool verified, bool finalized)",
  "function nextBatchId() external view returns (uint256)",
  "event BatchSubmitted(uint256 indexed batchId, bytes32 transactionsRoot)",
  "event BatchVerified(uint256 indexed batchId)",
  "event FraudReported(uint256 indexed batchId, bytes32 fraudProof)",
  "event FundsDeposited(address indexed user, uint256 amount)",
  "event FundsWithdrawn(address indexed user, uint256 amount)",
  "event BatchFinalized(uint256 indexed batchId)",
];

// Local development contract address
export const L2_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Default Hardhat first deployment address
export const BACKEND_URL = "http://localhost:5500"; // Local backend URL

// Declare window.ethereum
declare global {
  interface Window {
    ethereum: any;
  }
}
