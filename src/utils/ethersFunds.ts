
import { ethers } from "ethers";
import { toast } from "@/utils/toast";
import { ethersState } from "./ethersState";

// Deposit funds to L2
export const depositFunds = async (amount: string) => {
  if (!ethersState.contract || !ethersState.signer) {
    toast.error("Wallet not connected");
    return null;
  }

  try {
    const valueInWei = ethers.parseEther(amount);
    const tx = await ethersState.contract.depositFunds({ value: valueInWei });
    toast.info("Deposit transaction submitted. Waiting for confirmation...");
    
    const receipt = await tx.wait();
    
    // Update L2 balance
    const l2BalanceBigInt = await ethersState.contract.balances(ethersState.account);
    ethersState.l2Balance = ethers.formatEther(l2BalanceBigInt);
    
    toast.success("Funds deposited successfully!");
    return receipt;
  } catch (error) {
    console.error("Error depositing funds:", error);
    toast.error("Failed to deposit funds. Please try again.");
    return null;
  }
};

// Withdraw funds from L2
export const withdrawFunds = async (amount: string) => {
  if (!ethersState.contract || !ethersState.signer) {
    toast.error("Wallet not connected");
    return null;
  }

  try {
    const valueInWei = ethers.parseEther(amount);
    const tx = await ethersState.contract.withdrawFunds(valueInWei);
    toast.info("Withdrawal transaction submitted. Waiting for confirmation...");
    
    const receipt = await tx.wait();
    
    // Update balances
    const balance = await ethersState.provider?.getBalance(ethersState.account);
    if (balance) {
      ethersState.balance = ethers.formatEther(balance);
    }
    
    const l2BalanceBigInt = await ethersState.contract.balances(ethersState.account);
    ethersState.l2Balance = ethers.formatEther(l2BalanceBigInt);
    
    toast.success("Funds withdrawn successfully!");
    return receipt;
  } catch (error) {
    console.error("Error withdrawing funds:", error);
    toast.error("Failed to withdraw funds. Please try again.");
    return null;
  }
};

// Fetch L2 balance for an account
export const fetchL2Balance = async (account: string) => {
  if (!ethersState.contract) {
    return "0";
  }

  try {
    const balance = await ethersState.contract.balances(account);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error("Error fetching L2 balance:", error);
    return "0";
  }
};
