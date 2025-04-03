
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, ChevronDown, LogOut, Wallet } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { connectWallet, disconnectWallet, formatAddress, ethersState } from "@/utils/ethers";

const NavBar: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("0");
  const [l2Balance, setL2Balance] = useState("0");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Update state from ethersState
    const updateState = () => {
      setAccount(ethersState.account);
      setBalance(ethersState.balance);
      setL2Balance(ethersState.l2Balance);
      setIsConnected(ethersState.isConnected);
    };

    // Check if already connected
    if (ethersState.isConnected) {
      updateState();
    }

    // Setup interval to update balances
    const interval = setInterval(() => {
      if (ethersState.isConnected) {
        updateState();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleConnectWallet = async () => {
    const success = await connectWallet();
    if (success) {
      setAccount(ethersState.account);
      setBalance(ethersState.balance);
      setL2Balance(ethersState.l2Balance);
      setIsConnected(true);
    }
  };

  const handleDisconnectWallet = () => {
    disconnectWallet();
    setAccount("");
    setBalance("0");
    setL2Balance("0");
    setIsConnected(false);
  };

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/withdraw", label: "Withdraw" },
    { path: "/admin", label: "Admin" }
  ];

  return (
    <nav className="w-full py-4 glass-card mb-8">
      <div className="container flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/" className="text-xl font-bold text-white flex items-center">
            <div className="w-8 h-8 mr-2 bg-l2 rounded-full flex items-center justify-center">
              <span className="text-white">L2</span>
            </div>
            OptiFlo
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-6 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm ${
                location.pathname === link.path
                  ? "text-l2 font-medium"
                  : "text-gray-300 hover:text-white transition-colors"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Wallet Section */}
        <div className="hidden md:flex items-center space-x-4">
          {isConnected ? (
            <div className="flex items-center space-x-2">
              <div className="bg-secondary px-3 py-1 rounded-md mr-2">
                <p className="text-xs text-gray-400">Layer 1</p>
                <p className="text-sm font-medium">{parseFloat(balance).toFixed(4)} ETH</p>
              </div>
              <div className="bg-l2/20 px-3 py-1 rounded-md">
                <p className="text-xs text-l2-light">Layer 2</p>
                <p className="text-sm font-medium text-l2-light">{parseFloat(l2Balance).toFixed(4)} ETH</p>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-2">
                    <Wallet className="h-4 w-4 mr-2" />
                    {formatAddress(account)}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDisconnectWallet}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect Wallet
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button onClick={handleConnectWallet} className="bg-l2 hover:bg-l2-dark">
              Connect Wallet
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          {isConnected && (
            <div className="mr-4">
              <Wallet className="h-5 w-5 text-l2-light" />
            </div>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 rounded focus:outline-none"
          >
            <Menu className="h-6 w-6 text-white" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 space-y-2 bg-secondary/90 backdrop-blur-sm mt-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`block px-3 py-2 rounded-md ${
                location.pathname === link.path
                  ? "bg-l2 text-white"
                  : "text-gray-300 hover:bg-muted"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          
          {isConnected ? (
            <>
              <div className="flex justify-between px-3 py-2">
                <span className="text-sm text-gray-400">Layer 1:</span>
                <span className="text-sm">{parseFloat(balance).toFixed(4)} ETH</span>
              </div>
              <div className="flex justify-between px-3 py-2">
                <span className="text-sm text-l2-light">Layer 2:</span>
                <span className="text-sm text-l2-light">{parseFloat(l2Balance).toFixed(4)} ETH</span>
              </div>
              <div className="px-3 py-2 text-sm text-gray-300">
                {formatAddress(account)}
              </div>
              <button
                onClick={handleDisconnectWallet}
                className="w-full px-3 py-2 rounded-md text-left text-red-400 hover:bg-muted flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Disconnect Wallet
              </button>
            </>
          ) : (
            <button
              onClick={handleConnectWallet}
              className="w-full px-3 py-2 rounded-md bg-l2 text-white"
            >
              Connect Wallet
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default NavBar;
