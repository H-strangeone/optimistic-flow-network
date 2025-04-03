import { ethers } from "ethers";
import { toast } from "@/utils/toast";
import { getPendingTransactions, getProcessedBatches } from "@/services/layer2Service";

// Layer 2 contract interface
const contractABI = [
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

// Local development contract address - will be populated after deployment
// You can replace this with your deployed contract address
const L2_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Default Hardhat first deployment address
const BACKEND_URL = "http://localhost:5500"; // Local backend URL

interface Transaction {
  sender: string;
  recipient: string;
  amount: string;
}

interface Batch {
  batchId: number;
  transactionsRoot: string;
  timestamp: number;
  verified: boolean;
  finalized: boolean;
}

export type TransactionStatus = "pending" | "verified" | "finalized" | "failed";

export interface BatchTransaction {
  id: string;
  sender: string;
  recipient: string;
  amount: string;
  timestamp: number;
  status: TransactionStatus;
  batchId?: number;
}

// State management
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

// Connect to MetaMask
export const connectWallet = async () => {
  try {
    ethersState.isLoading = true;
    
    // Check if ethereum is available
    if (!window.ethereum) {
      toast.error("MetaMask not detected. Please install MetaMask to use this application.");
      ethersState.isLoading = false;
      return false;
    }

    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    if (accounts.length === 0) {
      toast.error("No accounts found.");
      ethersState.isLoading = false;
      return false;
    }

    // Setup provider and signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const network = await provider.getNetwork();
    
    // Get account balance
    const account = await signer.getAddress();
    const balance = await provider.getBalance(account);
    
    // Setup contract
    const contract = new ethers.Contract(L2_CONTRACT_ADDRESS, contractABI, signer);
    
    // Get L2 balance
    let l2Balance = "0";
    try {
      const l2BalanceBigInt = await contract.balances(account);
      l2Balance = ethers.formatEther(l2BalanceBigInt);
    } catch (error) {
      console.error("Error fetching L2 balance:", error);
      toast.error("Error connecting to L2 contract. Make sure you're on the correct network and the contract is deployed.");
    }

    // Update state
    ethersState.provider = provider;
    ethersState.signer = signer;
    ethersState.contract = contract;
    ethersState.account = account;
    ethersState.chainId = network.chainId.toString();
    ethersState.balance = ethers.formatEther(balance);
    ethersState.l2Balance = l2Balance;
    ethersState.isConnected = true;
    
    toast.success("Wallet connected successfully!");
    
    // Log connection details for debugging
    console.log("Connected to network:", getNetworkName(network.chainId.toString()));
    console.log("Connected account:", account);
    console.log("L1 Balance:", ethers.formatEther(balance), "ETH");
    console.log("L2 Balance:", l2Balance, "ETH");
    console.log("Contract address:", L2_CONTRACT_ADDRESS);
    
    return true;
  } catch (error) {
    console.error("Error connecting wallet:", error);
    toast.error("Failed to connect wallet. Please try again.");
    return false;
  } finally {
    ethersState.isLoading = false;
  }
};

// Get network name helper function
export const getNetworkName = (chainId: string) => {
  switch (chainId) {
    case "11155111":
      return "Sepolia Testnet";
    case "1":
      return "Ethereum Mainnet";
    case "31337":
      return "Local Hardhat Network";
    default:
      return "Unknown Network";
  }
};

// Disconnect wallet
export const disconnectWallet = () => {
  ethersState.provider = null;
  ethersState.signer = null;
  ethersState.contract = null;
  ethersState.account = "";
  ethersState.chainId = "";
  ethersState.balance = "0";
  ethersState.l2Balance = "0";
  ethersState.isConnected = false;
  
  toast.info("Wallet disconnected");
};

// Deposit funds to L2
export const depositFunds = async (amount: string) => {
  if (!ethersState.contract || !ethersState.signer) {
    toast.error("Wallet not connected");
    return null;
  }

  try {
    const valueInWei = ethers.parseEther(amount);
    const tx = await ethersState.contract.depositFunds({ value: valueInWei });
    toast.info("Deposit transaction submitted. Waiting for confirmation...");
    
    const receipt = await tx.wait();
    
    // Update L2 balance
    const l2BalanceBigInt = await ethersState.contract.balances(ethersState.account);
    ethersState.l2Balance = ethers.formatEther(l2BalanceBigInt);
    
    toast.success("Funds deposited successfully!");
    return receipt;
  } catch (error) {
    console.error("Error depositing funds:", error);
    toast.error("Failed to deposit funds. Please try again.");
    return null;
  }
};

// Withdraw funds from L2
export const withdrawFunds = async (amount: string) => {
  if (!ethersState.contract || !ethersState.signer) {
    toast.error("Wallet not connected");
    return null;
  }

  try {
    const valueInWei = ethers.parseEther(amount);
    const tx = await ethersState.contract.withdrawFunds(valueInWei);
    toast.info("Withdrawal transaction submitted. Waiting for confirmation...");
    
    const receipt = await tx.wait();
    
    // Update balances
    const balance = await ethersState.provider?.getBalance(ethersState.account);
    if (balance) {
      ethersState.balance = ethers.formatEther(balance);
    }
    
    const l2BalanceBigInt = await ethersState.contract.balances(ethersState.account);
    ethersState.l2Balance = ethers.formatEther(l2BalanceBigInt);
    
    toast.success("Funds withdrawn successfully!");
    return receipt;
  } catch (error) {
    console.error("Error withdrawing funds:", error);
    toast.error("Failed to withdraw funds. Please try again.");
    return null;
  }
};

// Submit batch transactions using our layer2Service
export const submitBatchTransactions = async (transactions: Transaction[], rootHash: string) => {
  if (!ethersState.contract || !ethersState.signer) {
    toast.error("Wallet not connected");
    return null;
  }

  try {
    // For this frontend, we'll just pass the root hash to the contract
    const tx = await ethersState.contract.submitBatch([rootHash]);
    toast.info("Batch transaction submitted. Waiting for confirmation...");
    
    const receipt = await tx.wait();
    toast.success("Batch submitted successfully!");
    
    return receipt;
  } catch (error) {
    console.error("Error submitting batch:", error);
    toast.error("Failed to submit batch. Please try again.");
    return null;
  }
};

// Verify a batch
export const verifyBatch = async (batchId: number) => {
  if (!ethersState.contract || !ethersState.signer) {
    toast.error("Wallet not connected");
    return null;
  }

  try {
    const tx = await ethersState.contract.verifyBatch(batchId);
    toast.info(`Verifying batch #${batchId}. Waiting for confirmation...`);
    
    const receipt = await tx.wait();
    toast.success(`Batch #${batchId} verified successfully!`);
    return receipt;
  } catch (error) {
    console.error("Error verifying batch:", error);
    toast.error("Failed to verify batch. Please try again.");
    return null;
  }
};

// Report fraud in a batch
export const reportFraud = async (batchId: number, fraudProof: string, transaction: Transaction, merkleProof: string[]) => {
  if (!ethersState.contract || !ethersState.signer) {
    toast.error("Wallet not connected");
    return null;
  }

  try {
    const tx = await ethersState.contract.reportFraud(
      batchId,
      fraudProof,
      [transaction.sender, transaction.recipient, ethers.parseEther(transaction.amount)],
      merkleProof
    );
    
    toast.info(`Reporting fraud for batch #${batchId}. Waiting for confirmation...`);
    const receipt = await tx.wait();
    toast.success(`Fraud report submitted for batch #${batchId}!`);
    return receipt;
  } catch (error) {
    console.error("Error reporting fraud:", error);
    toast.error("Failed to report fraud. Please try again.");
    return null;
  }
};

// Finalize a batch
export const finalizeBatch = async (batchId: number) => {
  if (!ethersState.contract || !ethersState.signer) {
    toast.error("Wallet not connected");
    return null;
  }

  try {
    const tx = await ethersState.contract.finalizeBatch(batchId);
    toast.info(`Finalizing batch #${batchId}. Waiting for confirmation...`);
    
    const receipt = await tx.wait();
    toast.success(`Batch #${batchId} finalized successfully!`);
    return receipt;
  } catch (error) {
    console.error("Error finalizing batch:", error);
    toast.error("Failed to finalize batch. Please try again.");
    return null;
  }
};

// Fetch L2 balance for an account
export const fetchL2Balance = async (account: string) => {
  if (!ethersState.contract) {
    return "0";
  }

  try {
    const balance = await ethersState.contract.balances(account);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error("Error fetching L2 balance:", error);
    return "0";
  }
};

// Fetch batch details with better error handling
export const fetchBatchDetails = async (batchId: number): Promise<Batch | null> => {
  if (!ethersState.contract) {
    return null;
  }

  try {
    const batch = await ethersState.contract.batches(batchId);
    return {
      batchId: Number(batch.batchId),
      transactionsRoot: batch.transactionsRoot,
      timestamp: Number(batch.timestamp),
      verified: batch.verified,
      finalized: batch.finalized
    };
  } catch (error) {
    console.error("Error fetching batch details:", error);
    toast.error("Failed to fetch batch details. Check if the contract is deployed correctly.");
    return null;
  }
};

// Fetch transactions from our layer2Service
export const fetchTransactions = async (): Promise<BatchTransaction[]> => {
  if (!ethersState.account) {
    return [];
  }
  
  try {
    // Get transactions from our layer2Service
    const pendingTxs = getPendingTransactions();
    const batches = getProcessedBatches();
    
    const result: BatchTransaction[] = [];
    
    // Add pending transactions
    pendingTxs.forEach((tx, index) => {
      if (tx.sender === ethersState.account || tx.recipient === ethersState.account) {
        result.push({
          id: `pending-${index}`,
          sender: tx.sender,
          recipient: tx.recipient,
          amount: tx.amount,
          timestamp: Date.now() - (index * 60000), // Fake timestamps for demo
          status: "pending",
        });
      }
    });
    
    // Add batch transactions
    batches.forEach(batch => {
      batch.transactions.forEach((tx, index) => {
        if (tx.sender === ethersState.account || tx.recipient === ethersState.account) {
          result.push({
            id: `batch-${batch.batchId}-${index}`,
            sender: tx.sender,
            recipient: tx.recipient,
            amount: tx.amount,
            timestamp: batch.timestamp - (index * 1000),
            status: batch.status === "pending" ? "pending" : 
                   batch.status === "verified" ? "verified" : 
                   batch.status === "finalized" ? "finalized" : "failed",
            batchId: batch.batchId
          });
        }
      });
    });
    
    // Sort by timestamp (newest first)
    result.sort((a, b) => b.timestamp - a.timestamp);
    
    return result;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    
    // Return mock data if layer2Service is not available
    return [
      {
        id: "0x123",
        sender: ethersState.account,
        recipient: "0x1234567890123456789012345678901234567890",
        amount: "0.1",
        timestamp: Date.now() - 1000 * 60 * 5,
        status: "verified",
        batchId: 1
      },
      {
        id: "0x456",
        sender: ethersState.account,
        recipient: "0x0987654321098765432109876543210987654321",
        amount: "0.05",
        timestamp: Date.now() - 1000 * 60 * 30,
        status: "pending",
        batchId: 2
      }
    ];
  }
};

// Fetch all batches from our layer2Service
export const fetchBatches = async () => {
  try {
    const batches = getProcessedBatches();
    
    return batches.map(batch => ({
      batchId: batch.batchId,
      transactionsRoot: batch.root,
      timestamp: batch.timestamp,
      verified: batch.status === "verified" || batch.status === "finalized",
      finalized: batch.status === "finalized"
    }));
  } catch (error) {
    console.error("Error fetching batches:", error);
    
    // Return mock data if layer2Service is not available
    return [
      {
        batchId: 1,
        transactionsRoot: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        timestamp: Date.now() - 1000 * 60 * 60 * 24,
        verified: true,
        finalized: false
      },
      {
        batchId: 2,
        transactionsRoot: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        timestamp: Date.now() - 1000 * 60 * 60 * 12,
        verified: false,
        finalized: false
      }
    ];
  }
};

// Setup event listeners for MetaMask
export const setupEventListeners = () => {
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', () => {
      toast.info("Account changed. Reconnecting...");
      connectWallet();
    });

    window.ethereum.on('chainChanged', () => {
      toast.info("Network changed. Refreshing...");
      window.location.reload();
    });

    window.ethereum.on('disconnect', () => {
      toast.info("Wallet disconnected");
      disconnectWallet();
    });
  }
};

// Format address for display
export const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Declare window.ethereum
declare global {
  interface Window {
    ethereum: any;
  }
}
