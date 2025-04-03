
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { ethersState, fetchTransactions, BatchTransaction, TransactionStatus } from '@/utils/ethers';

const TransactionTracker: React.FC = () => {
  const [transactions, setTransactions] = useState<BatchTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<TransactionStatus | 'all'>('all');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsConnected(ethersState.isConnected);
    
    const loadTransactions = async () => {
      if (ethersState.isConnected) {
        setIsLoading(true);
        const txs = await fetchTransactions();
        setTransactions(txs);
        setIsLoading(false);
      }
    };

    loadTransactions();

    // Set up interval to fetch transactions every 30 seconds
    const interval = setInterval(() => {
      if (ethersState.isConnected) {
        loadTransactions();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case 'verified':
        return <CheckCircle2 className="h-4 w-4 text-blockchain-verified" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-blockchain-pending" />;
      case 'finalized':
        return <CheckCircle2 className="h-4 w-4 text-blockchain-verified" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-blockchain-error" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusClass = (status: TransactionStatus) => {
    switch (status) {
      case 'verified':
        return 'status-verified';
      case 'pending':
        return 'status-pending';
      case 'finalized':
        return 'status-verified';
      case 'failed':
        return 'status-error';
      default:
        return 'text-gray-400';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(tx => tx.status === filter);

  return (
    <Card className="w-full blockchain-card">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="h-5 w-5 mr-2 text-l2-light" />
          Transaction Tracker
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>Monitor your Layer 2 transactions</span>
          <div className="flex space-x-2">
            <Badge 
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className="cursor-pointer"
            >
              All
            </Badge>
            <Badge 
              variant={filter === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilter('pending')}
              className="cursor-pointer"
            >
              Pending
            </Badge>
            <Badge 
              variant={filter === 'verified' ? 'default' : 'outline'}
              onClick={() => setFilter('verified')}
              className="cursor-pointer"
            >
              Verified
            </Badge>
            <Badge 
              variant={filter === 'failed' ? 'default' : 'outline'}
              onClick={() => setFilter('failed')}
              className="cursor-pointer"
            >
              Failed
            </Badge>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <div className="text-center py-6 text-gray-400">
            Please connect your wallet to view your transactions
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin-slow w-8 h-8 rounded-full border-t-2 border-l-2 border-l2"></div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="border border-dashed border-gray-700 rounded-md p-6 text-center text-gray-400">
            No transactions found
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((tx) => (
              <div key={tx.id} className="bg-secondary/30 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(tx.status)}
                    <span className={`text-sm font-medium ${getStatusClass(tx.status)}`}>
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </span>
                    {tx.batchId && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Batch #{tx.batchId}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{formatTime(tx.timestamp)}</span>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-xs text-gray-400">To: </span>
                    <span className="font-mono">{tx.recipient}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400">Amount: </span>
                      <span className="font-medium">{tx.amount} ETH</span>
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      {tx.id.slice(0, 10)}...
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionTracker;
