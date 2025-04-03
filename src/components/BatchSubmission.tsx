
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, SendHorizonal } from 'lucide-react';
import { toast } from "@/components/ui/sonner";
import { ethersState, submitBatchTransactions } from '@/utils/ethers';
import { createMerkleTreeFromTransactions } from '@/utils/merkleTree';

interface Transaction {
  sender: string;
  recipient: string;
  amount: string;
}

const BatchSubmission: React.FC = () => {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsConnected(ethersState.isConnected);
    
    // Set the sender address to the connected wallet
    if (ethersState.account && transactions.length === 0) {
      addEmptyTransaction();
    }
  }, []);

  const addEmptyTransaction = () => {
    setTransactions([
      ...transactions,
      { sender: ethersState.account, recipient: "", amount: "" }
    ]);
  };

  const updateTransaction = (index: number, field: keyof Transaction, value: string) => {
    const updatedTransactions = [...transactions];
    updatedTransactions[index] = { ...updatedTransactions[index], [field]: value };
    setTransactions(updatedTransactions);
  };

  const removeTransaction = (index: number) => {
    const updatedTransactions = [...transactions];
    updatedTransactions.splice(index, 1);
    setTransactions(updatedTransactions);
  };

  const addTransaction = () => {
    if (!recipientAddress || !amount) {
      toast.error("Please enter both recipient address and amount");
      return;
    }

    const newTransaction: Transaction = {
      sender: ethersState.account,
      recipient: recipientAddress,
      amount: amount
    };

    setTransactions([...transactions, newTransaction]);
    setRecipientAddress("");
    setAmount("");
  };

  const handleSubmitBatch = async () => {
    if (transactions.length === 0) {
      toast.error("Please add at least one transaction to the batch");
      return;
    }

    // Validate transactions
    for (const tx of transactions) {
      if (!tx.recipient || !tx.amount) {
        toast.error("All transactions must have a recipient and amount");
        return;
      }

      // Check if recipient is a valid Ethereum address
      if (!tx.recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
        toast.error(`Invalid recipient address: ${tx.recipient}`);
        return;
      }

      // Check if amount is a valid number
      if (isNaN(parseFloat(tx.amount)) || parseFloat(tx.amount) <= 0) {
        toast.error(`Invalid amount: ${tx.amount}`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      
      // Create merkle tree for these transactions
      const merkleTree = createMerkleTreeFromTransactions(transactions);
      const rootHash = merkleTree.getRoot();
      
      // Submit batch to the contract
      const receipt = await submitBatchTransactions(transactions, rootHash);
      
      if (receipt) {
        setTransactions([]);
        addEmptyTransaction();
        toast.success("Batch submitted successfully!");
      }
    } catch (error) {
      console.error("Error submitting batch:", error);
      toast.error("Failed to submit batch. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full blockchain-card">
      <CardHeader>
        <CardTitle className="flex items-center">
          <SendHorizonal className="h-5 w-5 mr-2 text-l2-light" />
          Batch Submission
        </CardTitle>
        <CardDescription>
          Create and submit transactions in batches for Layer 2 processing
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <>
            <div className="space-y-4">
              <h3 className="font-medium text-white/70">Current Batch Transactions</h3>
              
              {transactions.length === 0 ? (
                <div className="border border-dashed border-gray-700 rounded-md p-4 text-center text-gray-400">
                  No transactions added yet
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-secondary/30 p-3 rounded-lg">
                      <div className="flex-grow">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor={`recipient-${index}`} className="text-xs text-gray-400">
                              Recipient
                            </Label>
                            <Input
                              id={`recipient-${index}`}
                              value={tx.recipient}
                              onChange={(e) => updateTransaction(index, 'recipient', e.target.value)}
                              placeholder="0x..."
                              className="input-field mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`amount-${index}`} className="text-xs text-gray-400">
                              Amount (ETH)
                            </Label>
                            <Input
                              id={`amount-${index}`}
                              value={tx.amount}
                              onChange={(e) => updateTransaction(index, 'amount', e.target.value)}
                              placeholder="0.01"
                              type="number"
                              step="0.001"
                              className="input-field mt-1"
                            />
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeTransaction(index)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="pt-4">
                <h3 className="font-medium text-white/70 mb-2">Add New Transaction</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="Recipient Address"
                    className="input-field col-span-2"
                  />
                  <Input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount (ETH)"
                    type="number"
                    step="0.001"
                    className="input-field"
                  />
                </div>
                <Button 
                  onClick={addTransaction}
                  className="mt-3 bg-secondary hover:bg-secondary/80"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Batch
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-gray-400">
            Please connect your wallet to create batch transactions
          </div>
        )}
      </CardContent>
      {isConnected && (
        <CardFooter className="flex justify-end pt-4 border-t border-white/10">
          <Button
            onClick={handleSubmitBatch}
            disabled={isSubmitting || transactions.length === 0}
            className="bg-l2 hover:bg-l2-dark"
          >
            {isSubmitting ? "Submitting..." : "Submit Batch"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default BatchSubmission;
