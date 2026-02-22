import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';

const WalletModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const wallets = [
    { name: 'Trust Wallet', icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png' },
    { name: 'MetaMask', icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg' },
    { name: 'Binance Wallet', icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png' },
    { name: 'Bybit Wallet', icon: 'https://raw.githubusercontent.com/Bybit-Exchange/assets/master/logo/bybit-logo.png' },
    { name: 'WalletConnect', icon: 'https://raw.githubusercontent.com/WalletConnect/walletconnect-assets/master/Logo/Blue%20(Default)/Logo.svg' },
    { name: 'Coinbase Wallet', icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png' }
  ];

  const addTokenToWallet = async () => {
    if (!window.ethereum) return;
    
    try {
        // Switch to Polygon first
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x89' }], // 137 in hex
            });
        } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask.
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: '0x89',
                            chainName: 'Polygon Mainnet',
                            nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                            rpcUrls: ['https://polygon-rpc.com/'],
                            blockExplorerUrls: ['https://polygonscan.com/']
                        }],
                    });
                } catch (addError) {
                    console.error('Error adding Polygon:', addError);
                    return; // Stop if failed
                }
            } else {
                 console.error('Error switching chain:', switchError);
                 return;
            }
        }

        // Now add token
        await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20',
                options: {
                    address: '0xc291F63681Cd76383c3bDabE0B8E4bb072B4DF65',
                    symbol: 'AKGS',
                    decimals: 18,
                    image: 'https://i.ibb.co/j9SRz0Cy/Generated-image22.jpg',
                },
            },
        });
    } catch (error) {
        console.error('Error adding token:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          ></motion.div>
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-[#0a0a0a] border border-[#53FC18]/20 w-full max-w-md rounded-2xl p-6 shadow-[0_0_50px_rgba(83,252,24,0.1)]"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold mb-2 text-white">Connect Wallet</h2>
            <p className="text-gray-400 text-sm mb-6">Choose a wallet to connect to AKGS Empire</p>

            {/* Manual Token Add Button */}
            <button
                onClick={addTokenToWallet}
                className="w-full mb-4 bg-[#53FC18]/10 border border-[#53FC18] text-[#53FC18] font-bold py-2 rounded-xl hover:bg-[#53FC18] hover:text-black transition-all flex items-center justify-center gap-2"
            >
                <span className="text-lg">+</span> Add AKGS Token to Wallet
            </button>

            <div className="space-y-3">
              {wallets.map((wallet) => (
                <button
                  key={wallet.name}
                  className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-[#53FC18]/10 border border-white/5 hover:border-[#53FC18]/30 rounded-xl transition-all duration-200 group"
                  onClick={async () => {
                    if (wallet.name === 'MetaMask' || wallet.name === 'Trust Wallet' || wallet.name === 'Binance Wallet') {
                        if (typeof window.ethereum !== 'undefined') {
                            try {
                                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                                if (accounts.length > 0) {
                                    const address = accounts[0];
                                    localStorage.setItem('walletAddress', address);
                                    // Trigger storage event for other components
                                    window.dispatchEvent(new Event('storage'));
                                    window.dispatchEvent(new Event('wallet-connection-update'));
                                    
                                    // Try to add token to wallet
                                    await addTokenToWallet();
                                    
                                    onClose();
                                }
                            } catch (error) {
                                console.error(error);
                                alert('Connection failed: ' + error.message);
                            }
                        } else {
                            window.open('https://metamask.io/download/', '_blank');
                        }
                    } else {
                        // For others, just simulate or show alert
                        alert(`${wallet.name} integration coming soon! Please use MetaMask.`);
                        // onClose();
                    }
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 p-2 flex items-center justify-center">
                      <img src={wallet.icon} alt={wallet.name} className="w-full h-full object-contain" />
                    </div>
                    <span className="font-bold text-gray-200 group-hover:text-white">{wallet.name}</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-gray-600 group-hover:bg-[#53FC18] transition-colors"></div>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-xs text-gray-500">
                By connecting a wallet, you agree to AKGS Empire's <a href="#" className="text-[#53FC18] hover:underline">Terms of Service</a>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WalletModal;
