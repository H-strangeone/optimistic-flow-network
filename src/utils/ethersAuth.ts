
import { ethers } from "ethers";
import { toast } from "@/utils/toast";
import { ethersState, contractABI, L2_CONTRACT_ADDRESS } from "./ethersState";

// Connect to MetaMask
export const connectWallet = async () => {
  try {
    ethersState.isLoading = true;
    
    // Check if ethereum is available
    if (!window.ethereum) {
      toast.error("MetaMask not detected. Please install MetaMask to use this application.");
      ethersState.isLoading = false;
      return false;
    }

    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    if (accounts.length === 0) {
      toast.error("No accounts found.");
      ethersState.isLoading = false;
      return false;
    }

    // Setup provider and signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const network = await provider.getNetwork();
    
    // Get account balance
    const account = await signer.getAddress();
    const balance = await provider.getBalance(account);
    
    // Setup contract
    const contract = new ethers.Contract(L2_CONTRACT_ADDRESS, contractABI, signer);
    
    // Get L2 balance
    let l2Balance = "0";
    try {
      const l2BalanceBigInt = await contract.balances(account);
      l2Balance = ethers.formatEther(l2BalanceBigInt);
    } catch (error) {
      console.error("Error fetching L2 balance:", error);
      toast.error("Error connecting to L2 contract. Make sure you're on the correct network and the contract is deployed.");
    }

    // Update state
    ethersState.provider = provider;
    ethersState.signer = signer;
    ethersState.contract = contract;
    ethersState.account = account;
    ethersState.chainId = network.chainId.toString();
    ethersState.balance = ethers.formatEther(balance);
    ethersState.l2Balance = l2Balance;
    ethersState.isConnected = true;
    
    toast.success("Wallet connected successfully!");
    
    // Log connection details for debugging
    console.log("Connected to network:", getNetworkName(network.chainId.toString()));
    console.log("Connected account:", account);
    console.log("L1 Balance:", ethers.formatEther(balance), "ETH");
    console.log("L2 Balance:", l2Balance, "ETH");
    console.log("Contract address:", L2_CONTRACT_ADDRESS);
    
    return true;
  } catch (error) {
    console.error("Error connecting wallet:", error);
    toast.error("Failed to connect wallet. Please try again.");
    return false;
  } finally {
    ethersState.isLoading = false;
  }
};

// Disconnect wallet
export const disconnectWallet = () => {
  ethersState.provider = null;
  ethersState.signer = null;
  ethersState.contract = null;
  ethersState.account = "";
  ethersState.chainId = "";
  ethersState.balance = "0";
  ethersState.l2Balance = "0";
  ethersState.isConnected = false;
  
  toast.info("Wallet disconnected");
};

// Setup event listeners for MetaMask
export const setupEventListeners = () => {
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', () => {
      toast.info("Account changed. Reconnecting...");
      connectWallet();
    });

    window.ethereum.on('chainChanged', () => {
      toast.info("Network changed. Refreshing...");
      window.location.reload();
    });

    window.ethereum.on('disconnect', () => {
      toast.info("Wallet disconnected");
      disconnectWallet();
    });
  }
};

// Get network name helper function
export const getNetworkName = (chainId: string) => {
  switch (chainId) {
    case "11155111":
      return "Sepolia Testnet";
    case "1":
      return "Ethereum Mainnet";
    case "31337":
      return "Local Hardhat Network";
    default:
      return "Unknown Network";
  }
};
