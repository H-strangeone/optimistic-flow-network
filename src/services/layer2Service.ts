
import { ethers } from "ethers";
import { toast } from "@/utils/toast";
import MerkleTree, { Transaction, createMerkleTreeFromTransactions } from "@/utils/merkleTree";
import { ethersState } from "@/utils/ethers";

// In-memory state storage (would connect to a real DB in production)
let pendingTransactions: Transaction[] = [];
let processedBatches: { 
  batchId: number;
  transactions: Transaction[];
  root: string;
  timestamp: number;
  status: "pending" | "verified" | "finalized" | "challenged";
}[] = [];

// Pending transaction pool
export const addTransactionToPool = (tx: Transaction): string => {
  // Generate a unique transaction ID
  const txId = ethers.keccak256(
    ethers.solidityPacked(
      ["address", "address", "uint256", "uint256"],
      [tx.sender, tx.recipient, ethers.parseEther(tx.amount), Date.now()]
    )
  );
  
  pendingTransactions.push({
    ...tx,
    // Ensure amount is a string
    amount: tx.amount.toString()
  });
  
  console.log(`Transaction ${txId} added to pending pool`, tx);
  return txId;
};

// Get all pending transactions
export const getPendingTransactions = (): Transaction[] => {
  return [...pendingTransactions];
};

// Clear all pending transactions (after creating a batch)
export const clearPendingTransactions = (): void => {
  pendingTransactions = [];
};

// Create and submit a batch from pending transactions
export const createAndSubmitBatch = async (): Promise<number | null> => {
  if (!ethersState.contract || !ethersState.signer) {
    toast.error("Wallet not connected");
    return null;
  }

  if (pendingTransactions.length === 0) {
    toast.error("No pending transactions to batch");
    return null;
  }

  try {
    // Create Merkle tree and get root
    const merkleTree = createMerkleTreeFromTransactions(pendingTransactions);
    const root = merkleTree.getRoot();
    
    // Submit batch to contract
    const tx = await ethersState.contract.submitBatch([root]);
    toast.info("Batch submission in progress...");
    
    const receipt = await tx.wait();
    
    // Find the BatchSubmitted event to get the batchId
    const batchSubmittedEvent = receipt.logs
      .filter((log: any) => 
        log?.fragment?.name === "BatchSubmitted"
      )[0];
    
    let batchId: number | null = null;
    
    if (batchSubmittedEvent) {
      batchId = Number(batchSubmittedEvent.args[0]);
      
      // Store the batch in our local state
      processedBatches.push({
        batchId,
        transactions: [...pendingTransactions],
        root,
        timestamp: Date.now(),
        status: "pending"
      });
      
      // Clear pending transactions
      clearPendingTransactions();
      
      toast.success(`Batch #${batchId} submitted successfully!`);
      return batchId;
    } else {
      toast.error("Failed to get batch ID from transaction receipt");
      return null;
    }
  } catch (error) {
    console.error("Error submitting batch:", error);
    toast.error("Failed to submit batch. Please try again.");
    return null;
  }
};

// Get processed batches
export const getProcessedBatches = () => {
  return [...processedBatches];
};

// Get a specific batch
export const getBatch = (batchId: number) => {
  return processedBatches.find(batch => batch.batchId === batchId) || null;
};

// Update batch status
export const updateBatchStatus = (batchId: number, status: "pending" | "verified" | "finalized" | "challenged") => {
  const batchIndex = processedBatches.findIndex(batch => batch.batchId === batchId);
  if (batchIndex >= 0) {
    processedBatches[batchIndex].status = status;
    return true;
  }
  return false;
};

// Get transaction by ID (for a specific batch)
export const getTransactionInBatch = (batchId: number, txIndex: number) => {
  const batch = processedBatches.find(batch => batch.batchId === batchId);
  if (batch && txIndex >= 0 && txIndex < batch.transactions.length) {
    return batch.transactions[txIndex];
  }
  return null;
};

// Get Merkle proof for a transaction in a batch
export const getMerkleProofForTransaction = (batchId: number, txIndex: number) => {
  const batch = processedBatches.find(batch => batch.batchId === batchId);
  if (!batch || txIndex < 0 || txIndex >= batch.transactions.length) {
    return null;
  }

  const merkleTree = createMerkleTreeFromTransactions(batch.transactions);
  const leaf = MerkleTree.transactionToLeaf(batch.transactions[txIndex]);
  const proof = merkleTree.getProof(txIndex);
  
  return {
    leaf,
    proof,
    root: batch.root,
    transaction: batch.transactions[txIndex]
  };
};

// Clear all state (for testing/reset)
export const resetState = () => {
  pendingTransactions = [];
  processedBatches = [];
};

// Off-chain transaction execution
export const executeOffChainTransaction = (
  sender: string,
  recipient: string,
  amount: string
): string | null => {
  try {
    // Validate inputs
    if (!ethers.isAddress(sender) || !ethers.isAddress(recipient)) {
      toast.error("Invalid addresses provided");
      return null;
    }
    
    if (parseFloat(amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return null;
    }
    
    // In a real implementation, we would check the off-chain state
    // to ensure sender has enough balance
    
    // Add to pending pool
    const txId = addTransactionToPool({
      sender,
      recipient,
      amount
    });
    
    toast.success("Off-chain transaction executed successfully");
    return txId;
  } catch (error) {
    console.error("Error executing off-chain transaction:", error);
    toast.error("Failed to execute off-chain transaction");
    return null;
  }
};

// Mock persistence (would be a DB in production)
export const persistBatches = () => {
  try {
    localStorage.setItem("layer2_batches", JSON.stringify(processedBatches));
    localStorage.setItem("layer2_pending", JSON.stringify(pendingTransactions));
    return true;
  } catch (e) {
    console.error("Error persisting state:", e);
    return false;
  }
};

// Load from persistence
export const loadPersistedState = () => {
  try {
    const batches = localStorage.getItem("layer2_batches");
    const pending = localStorage.getItem("layer2_pending");
    
    if (batches) processedBatches = JSON.parse(batches);
    if (pending) pendingTransactions = JSON.parse(pending);
    
    return true;
  } catch (e) {
    console.error("Error loading persisted state:", e);
    return false;
  }
};

// Initialize by loading any persisted state
export const initializeLayer2Service = () => {
  loadPersistedState();
  
  // Setup periodic persistence
  setInterval(() => {
    persistBatches();
  }, 30000); // Save every 30 seconds
};
