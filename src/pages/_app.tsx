import type { AppProps } from 'next/app';
import { useMemo } from 'react';

import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';
import '@/styles/globals.css';
import { Inter } from 'next/font/google';
import { WalletProvider } from '@/components/WalletProvider';

const inter = Inter({ subsets: ['latin'] });



export default function App({ Component, pageProps }: AppProps) {
  const network = (process.env.NEXT_PUBLIC_SOLANA_NETWORK as 'devnet' | 'testnet' | 'mainnet-beta') || 'devnet';
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

  return (
    <div className={inter.className}>
      <WalletProvider>
        <Component {...pageProps} />
      </WalletProvider>
    </div>
  );
}


