
import React from 'react';
import { Shield, AlertTriangle, Layers } from 'lucide-react';
import AdminDashboard from '@/components/AdminDashboard';

const Admin: React.FC = () => {
  return (
    <div className="min-h-screen container py-8">
      <div className="mb-12 text-center max-w-3xl mx-auto">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-l2 rounded-full flex items-center justify-center animate-pulse-glow">
            <Shield className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-l2-light bg-clip-text text-transparent">
          Layer 2 Admin Dashboard
        </h1>
        <p className="text-lg text-gray-300 mb-6">
          Monitor and manage batch operations, verify state transitions, and detect fraud
        </p>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
          <div className="glass-card p-5">
            <Layers className="h-8 w-8 text-l2-light mb-3 mx-auto" />
            <h3 className="text-lg font-medium mb-1">Batch Management</h3>
            <p className="text-sm text-gray-400">
              Verify and finalize transaction batches to update the Layer 1 state
            </p>
          </div>
          
          <div className="glass-card p-5">
            <AlertTriangle className="h-8 w-8 text-blockchain-error mb-3 mx-auto" />
            <h3 className="text-lg font-medium mb-1">Fraud Detection</h3>
            <p className="text-sm text-gray-400">
              Submit fraud proofs to challenge incorrect state transitions
            </p>
          </div>
          
          <div className="glass-card p-5">
            <Shield className="h-8 w-8 text-blockchain-verified mb-3 mx-auto" />
            <h3 className="text-lg font-medium mb-1">State Security</h3>
            <p className="text-sm text-gray-400">
              Monitor batch verification status and ensure system integrity
            </p>
          </div>
        </div>
        
        <AdminDashboard />
      </div>
    </div>
  );
};

export default Admin;
