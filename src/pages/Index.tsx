
import React, { useState, useEffect } from 'react';
import { Zap, Layers, Shield } from 'lucide-react';
import ConnectWallet from '@/components/ConnectWallet';
import BatchSubmission from '@/components/BatchSubmission';
import TransactionTracker from '@/components/TransactionTracker';
import OffChainTransaction from '@/components/OffChainTransaction';
import { ethersState, setupEventListeners } from '@/utils/ethers';
import { initializeLayer2Service } from '@/services/layer2Service';

const Index: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    // Set up event listeners for MetaMask
    setupEventListeners();
    
    // Initialize Layer 2 service
    initializeLayer2Service();
    
    // Check if already connected
    setIsConnected(ethersState.isConnected);
  }, []);
  
  const handleConnect = () => {
    setIsConnected(true);
  };

  return (
    <div className="min-h-screen container py-8">
      <div className="mb-12 text-center max-w-3xl mx-auto">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-l2 rounded-full flex items-center justify-center animate-pulse-glow">
            <Layers className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-l2-light bg-clip-text text-transparent">
          OptiFlo Layer 2 Scaling Solution
        </h1>
        <p className="text-lg text-gray-300 mb-6">
          Optimistic rollup solution with off-chain transaction execution and on-chain state verification
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
          <div className="glass-card p-5">
            <Zap className="h-8 w-8 text-l2-light mb-3 mx-auto" />
            <h3 className="text-lg font-medium mb-1">Fast Transactions</h3>
            <p className="text-sm text-gray-400">
              Process transactions off-chain for high throughput and low latency
            </p>
          </div>
          
          <div className="glass-card p-5">
            <Layers className="h-8 w-8 text-l2-light mb-3 mx-auto" />
            <h3 className="text-lg font-medium mb-1">Batched Processing</h3>
            <p className="text-sm text-gray-400">
              Group multiple transactions into a single batch for cost efficiency
            </p>
          </div>
          
          <div className="glass-card p-5">
            <Shield className="h-8 w-8 text-l2-light mb-3 mx-auto" />
            <h3 className="text-lg font-medium mb-1">Fraud Proofs</h3>
            <p className="text-sm text-gray-400">
              Secure verification with Merkle trees and challenge periods
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
          <ConnectWallet onConnect={handleConnect} />
        </div>
        
        <div>
          {isConnected ? (
            <OffChainTransaction />
          ) : (
            <BatchSubmission />
          )}
        </div>
      </div>

      <div className="mt-8">
        <TransactionTracker />
      </div>
    </div>
  );
};

export default Index;
