
import React, { useState, useEffect } from 'react';
import { ArrowRight, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from '@/utils/toast';
import { ethersState, formatAddress } from '@/utils/ethers';
import { executeOffChainTransaction, getPendingTransactions, createAndSubmitBatch } from '@/services/layer2Service';
import { ethers } from "ethers";

const OffChainTransaction: React.FC = () => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBatching, setIsBatching] = useState(false);

  useEffect(() => {
    // Update pending count periodically
    const interval = setInterval(() => {
      setPendingCount(getPendingTransactions().length);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ethersState.isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (!recipient || !ethers.isAddress(recipient)) {
      toast.error("Please enter a valid recipient address");
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const txId = executeOffChainTransaction(
        ethersState.account,
        recipient,
        amount
      );
      
      if (txId) {
        toast.success("Transaction added to Layer 2 pending pool");
        setRecipient('');
        setAmount('');
        setPendingCount(getPendingTransactions().length);
      }
    } catch (error) {
      console.error("Error executing off-chain transaction:", error);
      toast.error("Failed to execute transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateBatch = async () => {
    if (pendingCount === 0) {
      toast.error("No pending transactions to batch");
      return;
    }
    
    setIsBatching(true);
    try {
      const batchId = await createAndSubmitBatch();
      if (batchId !== null) {
        setPendingCount(0);
      }
    } catch (error) {
      console.error("Error creating batch:", error);
      toast.error("Failed to create batch");
    } finally {
      setIsBatching(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-l2-light" />
          Off-Chain Transaction
        </CardTitle>
        <CardDescription>
          Execute fast Layer 2 transactions that will be rolled up to Layer 1
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Address</Label>
              <Input
                id="recipient"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="bg-secondary/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (ETH)</Label>
              <Input
                id="amount"
                type="number"
                step="0.001"
                min="0"
                placeholder="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-secondary/50"
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !ethersState.isConnected}
              className="w-full"
            >
              {isSubmitting ? "Processing..." : "Send Off-Chain Transaction"}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <div className="w-full flex flex-col gap-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Pending transactions:</span>
            <span className="font-medium">{pendingCount}</span>
          </div>
          
          {pendingCount > 0 && (
            <Button 
              onClick={handleCreateBatch}
              disabled={isBatching}
              variant="outline" 
              className="w-full flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              {isBatching ? "Processing..." : `Batch ${pendingCount} Transaction${pendingCount !== 1 ? 's' : ''}`}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default OffChainTransaction;
