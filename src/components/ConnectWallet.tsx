
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, AlertCircle, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { connectWallet, ethersState, depositFunds, getNetworkName } from '@/utils/ethers';
import { Input } from "@/components/ui/input";
import { toast } from "@/utils/toast";

interface ConnectWalletProps {
  onConnect?: () => void;
}

const ConnectWallet: React.FC<ConnectWalletProps> = ({ onConnect }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("0");
  const [l2Balance, setL2Balance] = useState("0");
  const [depositAmount, setDepositAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [chainId, setChainId] = useState("");
  const [isLocalNetwork, setIsLocalNetwork] = useState(false);

  useEffect(() => {
    // Check if already connected
    if (ethersState.isConnected) {
      setIsConnected(true);
      setAccount(ethersState.account);
      setBalance(ethersState.balance);
      setL2Balance(ethersState.l2Balance);
      setChainId(ethersState.chainId);
      setIsLocalNetwork(ethersState.chainId === "31337"); // Hardhat local network
    }
  }, []);

  const handleConnect = async () => {
    const success = await connectWallet();
    
    if (success) {
      setIsConnected(true);
      setAccount(ethersState.account);
      setBalance(ethersState.balance);
      setL2Balance(ethersState.l2Balance);
      setChainId(ethersState.chainId);
      setIsLocalNetwork(ethersState.chainId === "31337"); // Hardhat local network
      
      if (onConnect) {
        onConnect();
      }
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      setIsDepositing(true);
      const receipt = await depositFunds(depositAmount);
      
      if (receipt) {
        setBalance(ethersState.balance);
        setL2Balance(ethersState.l2Balance);
        setDepositAmount("");
        toast.success(`Successfully deposited ${depositAmount} ETH to Layer 2`);
      }
    } catch (error) {
      console.error("Deposit error:", error);
      toast.error("Failed to deposit. Check the console for more details.");
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto blockchain-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Wallet Connection</span>
          {isConnected && (
            <span className="text-sm bg-l2-dark/30 text-l2-light px-2 py-1 rounded-full">
              {getNetworkName(chainId)}
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Connect your wallet to interact with the Layer 2 solution
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <div className="flex flex-col items-center py-8">
            <Wallet className="h-16 w-16 text-white/60 mb-4" />
            <p className="text-white/70 mb-6 text-center">
              Connect your MetaMask wallet to deposit funds and interact with the Layer 2 network
            </p>
            <Button 
              onClick={handleConnect}
              size="lg"
              className="w-full bg-l2 hover:bg-l2-dark flex items-center justify-center space-x-2"
            >
              <Wallet className="h-5 w-5" />
              <span>Connect MetaMask</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {isLocalNetwork && (
              <div className="bg-amber-500/20 border border-amber-500/40 rounded-md p-3 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-amber-400">Development Environment Detected</h4>
                    <p className="text-xs text-gray-300 mt-1">
                      You're connected to a local development network. Make sure your contract is deployed at the correct address.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-muted/30 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Connected Account</p>
              <p className="text-base font-medium truncate">{account}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary/80 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">L1 Balance</p>
                <p className="text-lg font-medium">{parseFloat(balance).toFixed(4)} ETH</p>
              </div>
              <div className="bg-l2/20 p-3 rounded-lg">
                <p className="text-sm text-l2-light/70 mb-1">L2 Balance</p>
                <p className="text-lg font-medium text-l2-light">{parseFloat(l2Balance).toFixed(4)} ETH</p>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center mb-2">
                <ArrowDownToLine className="h-4 w-4 mr-2 text-l2-light" />
                <p className="text-sm font-medium">Deposit to Layer 2</p>
              </div>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Amount in ETH"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="input-field"
                  step="0.01"
                  min="0"
                />
                <Button 
                  onClick={handleDeposit}
                  disabled={isDepositing}
                  className="bg-l2 hover:bg-l2-dark"
                >
                  {isDepositing ? "Depositing..." : "Deposit"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      {isConnected && (
        <CardFooter className="flex justify-center border-t border-white/10 pt-4">
          <div className="flex items-center text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3 mr-1" />
            <span>Deposits are secured by the Layer 2 smart contract</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default ConnectWallet;
