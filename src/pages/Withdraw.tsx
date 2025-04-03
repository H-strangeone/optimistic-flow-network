
import React from 'react';
import { ArrowUpFromLine, Shield, Info } from 'lucide-react';
import WithdrawForm from '@/components/WithdrawForm';

const Withdraw: React.FC = () => {
  return (
    <div className="min-h-screen container py-8">
      <div className="mb-12 text-center max-w-3xl mx-auto">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-l2 rounded-full flex items-center justify-center animate-pulse-glow">
            <ArrowUpFromLine className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-l2-light bg-clip-text text-transparent">
          Withdraw From Layer 2
        </h1>
        <p className="text-lg text-gray-300 mb-6">
          Move your funds back to the Ethereum mainnet securely and efficiently
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="lg:col-span-1 lg:col-start-1 lg:col-end-2 flex items-center">
          <WithdrawForm />
        </div>
        
        <div className="lg:col-span-1 lg:col-start-2 lg:col-end-3">
          <div className="glass-card p-6 h-full">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Info className="h-5 w-5 mr-2 text-l2-light" />
              How Withdrawals Work
            </h2>
            
            <div className="space-y-4">
              <div className="bg-secondary/30 p-4 rounded-lg">
                <h3 className="font-medium text-l2-light mb-2 flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Secure Withdrawals
                </h3>
                <p className="text-sm text-gray-300">
                  When you withdraw from Layer 2, the funds are transferred back to your Layer 1 wallet address.
                  This is secured by the same smart contract that handles deposits.
                </p>
              </div>
              
              <div className="space-y-2 text-sm text-gray-300">
                <h3 className="font-medium text-white">Withdrawal Process:</h3>
                <ol className="list-decimal list-inside space-y-2 pl-2">
                  <li>Initiate a withdrawal request from this interface.</li>
                  <li>The Layer 2 contract verifies your balance.</li>
                  <li>Funds are transferred from the Layer 2 contract to your wallet.</li>
                  <li>Transaction is finalized on-chain.</li>
                </ol>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/10">
                <h3 className="font-medium text-white mb-2">Important Notes:</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-300 pl-2">
                  <li>Withdrawals are processed immediately but may take 1-2 minutes to finalize.</li>
                  <li>Gas fees apply for the withdrawal transaction.</li>
                  <li>You can only withdraw funds that have been fully verified on Layer 2.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Withdraw;
