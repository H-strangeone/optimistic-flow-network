import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpFromLine, AlertCircle, CheckCircle } from 'lucide-react';
import { ethersState, withdrawFunds } from '@/utils/ethers';
import { toast } from "@/utils/toast";

const WithdrawForm: React.FC = () => {
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [account, setAccount] = useState("");
  const [l2Balance, setL2Balance] = useState("0");
  const [l1Balance, setL1Balance] = useState("0");
  const [isConnected, setIsConnected] = useState(false);
  const [recentWithdrawal, setRecentWithdrawal] = useState<{amount: string, timestamp: number} | null>(null);

  useEffect(() => {
    // Check if already connected
    if (ethersState.isConnected) {
      setIsConnected(true);
      setAccount(ethersState.account);
      setL2Balance(ethersState.l2Balance);
      setL1Balance(ethersState.balance);
    }

    // Setup interval to update balances
    const interval = setInterval(() => {
      if (ethersState.isConnected) {
        setL2Balance(ethersState.l2Balance);
        setL1Balance(ethersState.balance);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const withdrawAmountNum = parseFloat(withdrawAmount);
    const l2BalanceNum = parseFloat(l2Balance);

    if (withdrawAmountNum > l2BalanceNum) {
      toast.error("Insufficient L2 balance");
      return;
    }

    try {
      setIsWithdrawing(true);
      const receipt = await withdrawFunds(withdrawAmount);
      
      if (receipt) {
        // Update balances from ethersState
        setL1Balance(ethersState.balance);
        setL2Balance(ethersState.l2Balance);
        
        // Record the withdrawal
        setRecentWithdrawal({
          amount: withdrawAmount,
          timestamp: Date.now()
        });
        
        setWithdrawAmount("");
        toast.success("Funds withdrawn successfully!");
      }
    } catch (error) {
      console.error("Withdraw error:", error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleMaxWithdraw = () => {
    setWithdrawAmount(l2Balance);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Card className="w-full max-w-md mx-auto blockchain-card">
      <CardHeader>
        <CardTitle className="flex items-center">
          <ArrowUpFromLine className="h-5 w-5 mr-2 text-l2-light" />
          Withdraw from Layer 2
        </CardTitle>
        <CardDescription>
          Transfer your funds from Layer 2 back to Layer 1
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-l2/20 p-3 rounded-lg">
                  <p className="text-sm text-l2-light/70 mb-1">L2 Balance</p>
                  <p className="text-lg font-medium text-l2-light">{parseFloat(l2Balance).toFixed(4)} ETH</p>
                </div>
                <div className="bg-secondary/80 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">L1 Balance</p>
                  <p className="text-lg font-medium">{parseFloat(l1Balance).toFixed(4)} ETH</p>
                </div>
              </div>
              
              <div className="pt-4">
                <label htmlFor="withdraw-amount" className="text-sm font-medium block mb-2">
                  Withdraw Amount
                </label>
                <div className="relative">
                  <Input
                    id="withdraw-amount"
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="input-field pr-16"
                    step="0.01"
                    min="0"
                    max={l2Balance}
                  />
                  <button
                    type="button"
                    onClick={handleMaxWithdraw}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-l2 hover:text-l2-light"
                  >
                    MAX
                  </button>
                </div>
              </div>
              
              {recentWithdrawal && (
                <div className="mt-4 bg-blockchain-verified/10 border border-blockchain-verified/30 rounded-md p-3">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-blockchain-verified mt-0.5 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-blockchain-verified">Withdrawal Successful</h4>
                      <p className="text-xs text-gray-300 mt-1">
                        Withdrawn {parseFloat(recentWithdrawal.amount).toFixed(4)} ETH at {formatTime(recentWithdrawal.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-gray-400">
            Please connect your wallet to withdraw funds
          </div>
        )}
      </CardContent>
      {isConnected && (
        <CardFooter className="flex flex-col pt-4 border-t border-white/10">
          <Button
            onClick={handleWithdraw}
            disabled={isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > parseFloat(l2Balance)}
            className="w-full bg-l2 hover:bg-l2-dark"
          >
            {isWithdrawing ? "Processing..." : "Withdraw to Layer 1"}
          </Button>
          
          <div className="flex items-center text-xs text-muted-foreground mt-4">
            <AlertCircle className="h-3 w-3 mr-1" />
            <span>Withdrawals are processed immediately but may take 1-2 minutes to finalize.</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default WithdrawForm;
