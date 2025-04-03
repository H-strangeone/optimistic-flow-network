
import { ethers } from "ethers";
import { toast } from "@/utils/toast";
import { ethersState } from "./ethersState";
import { getPendingTransactions, getProcessedBatches } from "@/services/layer2Service";

export interface Transaction {
  sender: string;
  recipient: string;
  amount: string;
}

export interface Batch {
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

// Submit batch transactions 
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
