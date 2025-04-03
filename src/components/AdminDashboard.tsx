import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Lock,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { 
  fetchBatches, 
  verifyBatch,
  finalizeBatch,
  reportFraud,
  ethersState
} from '@/utils/ethers';
import { toast } from "@/utils/toast";

interface Batch {
  batchId: number;
  transactionsRoot: string;
  timestamp: number;
  verified: boolean;
  finalized: boolean;
}

const AdminDashboard: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingBatchId, setProcessingBatchId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsConnected(ethersState.isConnected);
    
    const loadBatches = async () => {
      if (ethersState.isConnected) {
        setIsLoading(true);
        const loadedBatches = await fetchBatches();
        setBatches(loadedBatches);
        setIsLoading(false);
      }
    };

    loadBatches();

    // Set up interval to refresh batches
    const interval = setInterval(() => {
      if (ethersState.isConnected) {
        loadBatches();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleVerifyBatch = async (batchId: number) => {
    setProcessingBatchId(batchId);
    try {
      const receipt = await verifyBatch(batchId);
      if (receipt) {
        // Update batch status in local state
        setBatches(prevBatches => 
          prevBatches.map(batch => 
            batch.batchId === batchId ? { ...batch, verified: true } : batch
          )
        );
        toast.success(`Batch #${batchId} verified successfully!`);
      }
    } catch (error) {
      console.error(`Error verifying batch #${batchId}:`, error);
      toast.error(`Failed to verify batch #${batchId}`);
    } finally {
      setProcessingBatchId(null);
    }
  };

  const handleFinalizeBatch = async (batchId: number) => {
    setProcessingBatchId(batchId);
    try {
      const receipt = await finalizeBatch(batchId);
      if (receipt) {
        // Update batch status in local state
        setBatches(prevBatches => 
          prevBatches.map(batch => 
            batch.batchId === batchId ? { ...batch, finalized: true } : batch
          )
        );
        toast.success(`Batch #${batchId} finalized successfully!`);
      }
    } catch (error) {
      console.error(`Error finalizing batch #${batchId}:`, error);
      toast.error(`Failed to finalize batch #${batchId}`);
    } finally {
      setProcessingBatchId(null);
    }
  };

  const handleChallengeBatch = async (batchId: number) => {
    toast.info(`This would fetch proof data for batch #${batchId} and submit a fraud proof.`);
    // This is a stub for the fraud proof feature
    // In a real implementation, you would fetch the proof from the backend
    // and then call reportFraud with the appropriate parameters
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatTimeSince = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const seconds = now - timestamp;
    
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const challengePeriodOver = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    // 1 week in seconds
    return (now - timestamp) > (7 * 24 * 60 * 60);
  };

  const getBatchStatusIcon = (batch: Batch) => {
    if (batch.finalized) return <Lock className="h-5 w-5 text-blockchain-verified" />;
    if (batch.verified) return <CheckCircle className="h-5 w-5 text-blockchain-pending" />;
    return <Clock className="h-5 w-5 text-gray-400" />;
  };

  const getBatchStatusText = (batch: Batch) => {
    if (batch.finalized) return "Finalized";
    if (batch.verified) return "Verified";
    return "Pending";
  };

  return (
    <Card className="w-full blockchain-card">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2 text-l2-light" />
          Admin Dashboard
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>Monitor and manage Layer 2 batches</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <div className="text-center py-6 text-gray-400">
            Please connect your wallet to access admin functions
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin-slow w-8 h-8 rounded-full border-t-2 border-l-2 border-l2"></div>
          </div>
        ) : batches.length === 0 ? (
          <div className="border border-dashed border-gray-700 rounded-md p-6 text-center text-gray-400">
            No batches found
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {batches.map((batch) => (
                <div key={batch.batchId} className="bg-secondary/30 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getBatchStatusIcon(batch)}
                      <div>
                        <h3 className="text-base font-medium">Batch #{batch.batchId}</h3>
                        <p className="text-xs text-gray-400">{formatTimeSince(batch.timestamp)}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium
                      ${batch.finalized ? 'bg-blockchain-verified/20 text-blockchain-verified' : 
                        batch.verified ? 'bg-blockchain-pending/20 text-blockchain-pending' : 
                        'bg-gray-700/50 text-gray-300'}`}>
                      {getBatchStatusText(batch)}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-xs text-gray-400 mb-1">Transactions Root</p>
                    <p className="text-sm font-mono break-all text-gray-300">{batch.transactionsRoot}</p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-xs text-gray-400 mb-1">Submitted</p>
                    <p className="text-sm">{formatTime(batch.timestamp)}</p>
                  </div>
                  
                  <div className="flex space-x-2">
                    {!batch.verified && (
                      <Button
                        size="sm"
                        onClick={() => handleVerifyBatch(batch.batchId)}
                        disabled={processingBatchId === batch.batchId}
                        className="bg-l2 hover:bg-l2-dark flex items-center"
                      >
                        <FileCheck className="h-4 w-4 mr-1" />
                        Verify
                      </Button>
                    )}
                    
                    {batch.verified && !batch.finalized && challengePeriodOver(batch.timestamp) && (
                      <Button
                        size="sm"
                        onClick={() => handleFinalizeBatch(batch.batchId)}
                        disabled={processingBatchId === batch.batchId}
                        className="bg-blockchain-verified hover:bg-blockchain-verified/80 flex items-center"
                      >
                        <Lock className="h-4 w-4 mr-1" />
                        Finalize
                      </Button>
                    )}
                    
                    {!batch.finalized && !batch.verified && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleChallengeBatch(batch.batchId)}
                        disabled={processingBatchId === batch.batchId}
                        className="border-red-500 text-red-400 hover:bg-red-900/20"
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Challenge
                      </Button>
                    )}
                    
                    {!batch.finalized && batch.verified && !challengePeriodOver(batch.timestamp) && (
                      <div className="flex items-center text-xs text-blockchain-pending">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        <span>Challenge period active</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminDashboard;
