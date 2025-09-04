'use client';

import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletIcon } from '@solana/wallet-adapter-react-ui';
import { X, Download, ExternalLink, RefreshCw } from 'lucide-react';
import {
  isMobile,
  isPWA,
  hasSolanaWallet,
  getWalletType,
  getDeepLinkUrl,
} from '@/utils/deviceDetection';

interface MobileWalletConnectProps {
  onMintingComplete?: (result: any) => void;
  isVisible: boolean;
  onClose: () => void;
  username?: string;
  followersCount?: number;
}

const MobileWalletConnect: React.FC<MobileWalletConnectProps> = ({
  isVisible,
  onClose,
  onMintingComplete,
}) => {
  const { wallets, select, connected, publicKey } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isPWA: false,
    hasWallet: false,
    walletType: null as 'phantom' | 'solflare' | 'other' | null,
  });
  const [availableWallets, setAvailableWallets] = useState<any[]>([]);

  useEffect(() => {
    const checkDevice = () => {
      const mobile = isMobile();
      const pwa = isPWA();
      const hasWallet = hasSolanaWallet();
      const walletType = getWalletType();

      setDeviceInfo({ isMobile: mobile, isPWA: pwa, hasWallet, walletType });

      // Filter wallets to only show those that actually exist
      const filteredWallets = wallets.filter(wallet => {
        // Check for Extension Wallets (Desktop)
        if (wallet.adapter.name.toLowerCase().includes('phantom')) {
          return (
            'phantom' in window && (window as any).phantom?.solana?.isPhantom
          );
        }
        if (wallet.adapter.name.toLowerCase().includes('solflare')) {
          return 'solflare' in window && (window as any).solflare?.isSolflare;
        }
        if (wallet.adapter.name.toLowerCase().includes('solana')) {
          return 'solana' in window;
        }
        // For other wallets, check if they have a detect method or are actually available
        return (
          wallet.adapter.readyState === 'Installed' ||
          wallet.adapter.readyState === 'Loadable'
        );
      });

      setAvailableWallets(filteredWallets);
    };

    checkDevice();

    // Re-check when window loads (for newly installed wallets)
    const handleWalletInstalled = () => {
      setTimeout(checkDevice, 1000);
    };

    window.addEventListener('load', handleWalletInstalled);
    return () => window.removeEventListener('load', handleWalletInstalled);
  }, [wallets]);

  const handleWalletSelect = async (wallet: any) => {
    setIsConnecting(true);
    try {
      await select(wallet.adapter.name);
      // Don't close immediately - let user see connection status
      setTimeout(() => {
        if (connected && publicKey) {
          // Call the callback to notify parent component with actual wallet address
          if (onMintingComplete) {
            onMintingComplete({
              success: true,
              wallet: wallet.adapter.name,
              address: publicKey.toString(),
            });
          }
          onClose();
        }
      }, 1000);
    } catch (error) {
      console.error('Wallet connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleInstallWallet = (walletType: 'phantom' | 'solflare') => {
    if (walletType === 'phantom') {
      if (deviceInfo.isMobile) {
        // Deep link to Phantom app store
        window.open('https://phantom.app/', '_blank');
      } else {
        // Desktop - open Phantom website
        window.open('https://phantom.app/', '_blank');
      }
    } else if (walletType === 'solflare') {
      if (deviceInfo.isMobile) {
        // Deep link to Solflare app store
        window.open('https://solflare.com/', '_blank');
      } else {
        // Desktop - open Solflare website
        window.open('https://solflare.com/', '_blank');
      }
    }
  };

  const handleDeepLink = (walletType: 'phantom' | 'solflare') => {
    const deepLinkUrl = getDeepLinkUrl(walletType, window.location.href);
    if (deepLinkUrl) {
      window.location.href = deepLinkUrl;
    }
  };

  const handleRefreshWallets = () => {
    // Re-check wallet availability
    const checkDevice = () => {
      const mobile = isMobile();
      const pwa = isPWA();
      const hasWallet = hasSolanaWallet();
      const walletType = getWalletType();

      setDeviceInfo({ isMobile: mobile, isPWA: pwa, hasWallet, walletType });

      const filteredWallets = wallets.filter(wallet => {
        if (wallet.adapter.name.toLowerCase().includes('phantom')) {
          return (
            'phantom' in window && (window as any).phantom?.solana?.isPhantom
          );
        }
        if (wallet.adapter.name.toLowerCase().includes('solflare')) {
          return 'solflare' in window && (window as any).solflare?.isSolflare;
        }
        if (wallet.adapter.name.toLowerCase().includes('solana')) {
          return 'solana' in window;
        }
        return (
          wallet.adapter.readyState === 'Installed' ||
          wallet.adapter.readyState === 'Loadable'
        );
      });

      setAvailableWallets(filteredWallets);
    };

    checkDevice();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center transition-opacity duration-500">
      <div
        className="fixed inset-0 bg-black bg-opacity-80 transition-opacity bg-[#000000E5] duration-500"
        onClick={onClose}
      />

      <div className="flex flex-col gap-4 w-80 mb-10 opacity-95 p-6 rounded-2xl bg-[#17191B] absolute z-40 bottom-0 duration-500 ease-in-out max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between h-[2rem] gap-4">
          <p className="font-bold text-white text-[1.5rem] leading-[1.5625rem]">
            {deviceInfo.isMobile ? 'Mobile Wallet Connect' : 'Wallet Connect'}
          </p>
          <button
            className="flex items-center justify-center w-8 h-8 p-[6px] rounded-full bg-[#2FD3BA]"
            onClick={onClose}
          >
            <X className="w-4 h-4" style={{ color: '#292929' }} />
          </button>
        </div>

        {/* Available Wallets */}
        {availableWallets.length > 0 && (
          <div className="space-y-3">
            <p className="text-white text-sm font-semibold">
              Available Wallets:
            </p>
            {availableWallets.map(wallet => (
              <button
                key={wallet.adapter.name}
                onClick={() => handleWalletSelect(wallet)}
                disabled={isConnecting}
                className="flex items-center border border-[#272727] w-full p-3 bg-[#272727] rounded-full hover:bg-[#4A4A4A] hover:border-[#2FD3BA] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <WalletIcon wallet={wallet} className="w-6 h-6 mr-3" />
                <span className="font-bold text-[18px] leading-5">
                  {wallet.adapter.name}
                </span>
                {isConnecting && (
                  <div className="ml-auto animate-spin rounded-full h-4 w-4 border-b-2 border-[#2FD3BA]"></div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Connection Status - Changed from "Connected" to "Wallet Connected (address)" */}
        {connected && publicKey && (
          <div className="bg-green-900/20 p-3 rounded-lg border border-green-500/50">
            <p className="text-green-400 text-sm mb-2">
              Wallet Connected: {publicKey.toString().slice(0, 4)}...
              {publicKey.toString().slice(-4)}
            </p>
          </div>
        )}

        {deviceInfo.isMobile &&
          deviceInfo.walletType &&
          (deviceInfo.walletType === 'phantom' ||
            deviceInfo.walletType === 'solflare') && (
            <div className="bg-purple-900/20 p-3 rounded-lg border border-purple-500/30">
              <p className="text-purple-300 text-xs mb-2">
                <strong>Open in Wallet App:</strong>
              </p>
              <button
                onClick={() =>
                  handleDeepLink(
                    deviceInfo.walletType as 'phantom' | 'solflare'
                  )
                }
                className="flex items-center gap-2 w-full px-3 py-2 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 transition-all"
              >
                <ExternalLink className="w-3 h-3" />
                Open in {deviceInfo.walletType} App
              </button>
            </div>
          )}
      </div>
    </div>
  );
};

export default MobileWalletConnect;
