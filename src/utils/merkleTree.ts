
import { ethers } from "ethers";

export interface Transaction {
  sender: string;
  recipient: string;
  amount: string;
}

class MerkleTree {
  private layers: string[][];
  
  constructor(leaves: string[]) {
    // Create leaf nodes
    const hashes = leaves.map(MerkleTree.hashLeaf);
    this.layers = [hashes];
    
    // Build the tree
    this.buildTree();
  }

  private buildTree(): void {
    let currentLayer = this.layers[0];
    
    // Build each layer until we reach the root
    while (currentLayer.length > 1) {
      const nextLayer: string[] = [];
      
      // Process pairs of nodes
      for (let i = 0; i < currentLayer.length; i += 2) {
        if (i + 1 < currentLayer.length) {
          // Hash the pair and add to the next layer
          const left = currentLayer[i];
          const right = currentLayer[i + 1];
          nextLayer.push(MerkleTree.hashPair(left, right));
        } else {
          // Odd number of nodes, just pass it up to the next layer
          nextLayer.push(currentLayer[i]);
        }
      }
      
      // Add the new layer to our tree
      this.layers.push(nextLayer);
      currentLayer = nextLayer;
    }
  }

  // Get the root of the tree
  public getRoot(): string {
    return this.layers[this.layers.length - 1][0];
  }

  // Get merkle proof for a given leaf
  public getProof(leafIndex: number): string[] {
    if (leafIndex < 0 || leafIndex >= this.layers[0].length) {
      throw new Error('Leaf index out of range');
    }

    const proof: string[] = [];
    let index = leafIndex;

    for (let i = 0; i < this.layers.length - 1; i++) {
      const layer = this.layers[i];
      
      // Get the sibling of the current node
      const isRightNode = index % 2 === 0;
      const siblingIndex = isRightNode ? index + 1 : index - 1;
      
      // If sibling exists, add to proof
      if (siblingIndex < layer.length) {
        proof.push(layer[siblingIndex]);
      }
      
      // Move to the parent index
      index = Math.floor(index / 2);
    }

    return proof;
  }

  // Static method to convert a transaction to a leaf
  static transactionToLeaf(transaction: Transaction): string {
    return ethers.solidityPackedKeccak256(
      ["address", "address", "uint256"],
      [transaction.sender, transaction.recipient, ethers.parseEther(transaction.amount)]
    );
  }

  // Hash a leaf node
  private static hashLeaf(value: string): string {
    return value;
  }

  // Hash a pair of nodes
  private static hashPair(left: string, right: string): string {
    return left < right
      ? ethers.solidityPackedKeccak256(["bytes32", "bytes32"], [left, right])
      : ethers.solidityPackedKeccak256(["bytes32", "bytes32"], [right, left]);
  }

  // Verify a merkle proof
  static verifyProof(leaf: string, proof: string[], root: string): boolean {
    let computedHash = leaf;
    
    for (const proofElement of proof) {
      computedHash = computedHash < proofElement
        ? ethers.solidityPackedKeccak256(["bytes32", "bytes32"], [computedHash, proofElement])
        : ethers.solidityPackedKeccak256(["bytes32", "bytes32"], [proofElement, computedHash]);
    }
    
    return computedHash === root;
  }
}

// Helper function to create a Merkle tree from transactions
export const createMerkleTreeFromTransactions = (transactions: Transaction[]): MerkleTree => {
  const leaves = transactions.map((tx) => MerkleTree.transactionToLeaf(tx));
  return new MerkleTree(leaves);
};

// Helper to get transaction leaf and proof for a given index
export const getTransactionProof = (
  transactions: Transaction[],
  txIndex: number
): { leaf: string; proof: string[]; root: string } => {
  const tree = createMerkleTreeFromTransactions(transactions);
  const leaf = MerkleTree.transactionToLeaf(transactions[txIndex]);
  const proof = tree.getProof(txIndex);
  const root = tree.getRoot();
  
  return { leaf, proof, root };
};

// Helper to demonstrate fraud (for testing)
export const createFraudulentProof = (
  transactions: Transaction[],
  txIndex: number,
  modifiedTransaction: Transaction
): { 
  leaf: string; 
  fraudulentLeaf: string; 
  proof: string[]; 
  root: string 
} => {
  const tree = createMerkleTreeFromTransactions(transactions);
  const leaf = MerkleTree.transactionToLeaf(transactions[txIndex]);
  const fraudulentLeaf = MerkleTree.transactionToLeaf(modifiedTransaction);
  const proof = tree.getProof(txIndex);
  const root = tree.getRoot();
  
  return { leaf, fraudulentLeaf, proof, root };
};

export default MerkleTree;
