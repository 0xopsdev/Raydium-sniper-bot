'use client';

import { FC, useMemo } from 'react';
import type { ReactNode } from 'react';
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  SolflareWalletAdapter,
  TorusWalletAdapter,
  PhantomWalletAdapter,
  WalletConnectWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: FC<WalletProviderProps> = ({ children }) => {
  const network = WalletAdapterNetwork.Mainnet;

  const endpoint = useMemo(
    () =>
      "https://api.devnet.solana.com",
    [network]
  );

  const wallets = useMemo(
    () => [
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new PhantomWalletAdapter(),
      new WalletConnectWalletAdapter({
        network,
        options: {
          projectId: '7ca5531f56b54bc50c5e522b084071bb',
          metadata: {
            name: 'CryptoLottery',
            description: 'Claim your free NFT lottery ticket',
            url:
              typeof window !== 'undefined'
                ? window.location.origin
                : 'https://cryptolottery.com',
            icons: [
              typeof window !== 'undefined'
                ? `${window.location.origin}/logo.png`
                : 'https://cryptolottery.com/logo.png',
            ],
          },
        },
      }),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children as any}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};
