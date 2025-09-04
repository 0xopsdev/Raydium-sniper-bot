import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';

export default function ConnectWalletPage() {
  const router = useRouter();
  const { tickets, amount, user } = router.query;
  
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected, wallet } = useWallet();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [paymentId, setPaymentId] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [recipientAddress] = useState('EPnmEdiLyv38zZ2Fq9ma3NvejjzsDh8YJnUQwf98i3MY');

  useEffect(() => {
    // Only redirect if router is ready and parameters are still missing
    if (router.isReady && (!tickets || !amount || !user)) {
      router.push('/');
    }
  }, [router.isReady, tickets, amount, user, router]);

  // Auto-sync wallet when connected
  useEffect(() => {
    if (connected && publicKey) {
      syncWalletToBackend();
    }
  }, [connected, publicKey, user]);

  const syncWalletToBackend = async () => {
    if (!publicKey || !user) return;
    
    try {
      await fetch('/api/user/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discordId: user,
          walletAddress: publicKey.toBase58(),
          walletType: wallet?.adapter?.name || 'Unknown'
        })
      });
      console.log('Wallet synced to backend');
    } catch (error) {
      console.error('Error syncing wallet:', error);
    }
  };

  const sendPayment = async () => {
    if (!connected || !publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    setPaymentStatus('processing');

    try {
      // Create payment record
      const paymentResponse = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discordId: user,
          amount: parseFloat(amount as string) * 0.01,
          ticketCount: parseInt(tickets as string),
          walletAddress: publicKey.toBase58()
        })
      });

      const paymentData = await paymentResponse.json();
      
      if (paymentData.success) {
        setPaymentId(paymentData.paymentId);
        
        // Create real Solana transaction
        const recipient = new PublicKey(recipientAddress);
        const solAmount = parseFloat(amount as string) * 0.01; // Convert ticket count to SOL
        const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);

        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: recipient,
            lamports: lamports
          })
        );

        // Send transaction through user's connected wallet
        const signature = await sendTransaction(transaction, connection);
        setTransactionHash(signature);

        // Wait for transaction confirmation
        await connection.confirmTransaction(signature, 'confirmed');
        
        setPaymentStatus('completed');
        
        // Update payment status in backend
        await fetch('/api/payment/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId: paymentData.paymentId,
            transactionHash: signature,
            status: 'completed'
          })
        });

        // Redirect to number selection after 2 seconds
        setTimeout(() => {
          router.push(`/select-numbers?paymentId=${paymentData.paymentId}&user=${user}&tickets=${tickets}&wallet=${publicKey.toBase58()}`);
        }, 2000);

      } else {
        setPaymentStatus('failed');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setPaymentStatus('failed');
      alert('Payment failed: ' + (error as Error).message);
    }
  };

  if (!router.isReady || !tickets || !amount || !user) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Connect Wallet & Pay - Crypto Lottery</title>
        <meta name="description" content="Connect wallet and complete payment" />
      </Head>
      
      <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">🔗 Connect Wallet & Pay</h1>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-4">Order Summary</h2>
            <div className="space-y-2 text-gray-200">
              <p><span className="font-medium">Tickets:</span> {tickets}</p>
              <p><span className="font-medium">Amount:</span> ${amount} USDC</p>
              <p><span className="font-medium">Discord User:</span> {user}</p>
            </div>
          </div>

        {!connected ? (
          <div className="bg-green-500/20 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-green-400/30">
            <h3 className="text-2xl font-semibold text-white mb-4">🔗 Step 1: Connect Your Wallet</h3>
            <p className="text-gray-200 mb-6">Connect your Solana wallet to proceed with payment.</p>
            <div className="flex justify-center">
              <WalletMultiButton className="!bg-blue-600 !hover:bg-blue-700 !px-8 !py-4 !rounded-xl !font-semibold !text-lg" />
            </div>
          </div>
        ) : (
          <div className="bg-blue-500/20 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-blue-400/30">
            <h3 className="text-2xl font-semibold text-white mb-4">✅ Step 1: Wallet Connected</h3>
            <div className="space-y-2 text-gray-200">
              <p><span className="font-medium">Address:</span> {publicKey?.toBase58()}</p>
              <p><span className="font-medium">Type:</span> {wallet?.adapter?.name}</p>
            </div>
          </div>
        )}

        {connected && paymentStatus === 'pending' && (
          <div className="bg-yellow-500/20 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-yellow-400/30">
            <h3 className="text-2xl font-semibold text-white mb-4">💰 Step 2: Send Payment</h3>
            <div className="space-y-4">
              <div>
                <p className="text-gray-200 font-medium mb-2">Recipient Address:</p>
                <div className="bg-black/30 rounded-lg p-4 font-mono text-sm text-gray-300 break-all border border-gray-600">
                  {recipientAddress}
                </div>
              </div>
              <div className="space-y-2 text-gray-200">
                <p><span className="font-medium">Amount to Send:</span> {parseFloat(amount as string) * 0.01} SOL</p>
                <p><span className="font-medium">Network:</span> Solana Devnet</p>
              </div>
              <button
                onClick={sendPayment}
                className="w-full px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold text-lg rounded-xl transition-all duration-200 shadow-lg hover:shadow-green-500/25"
              >
                Send {parseFloat(amount as string) * 0.01} SOL
              </button>
            </div>
          </div>
        )}

        {paymentStatus === 'processing' && (
          <div className="bg-blue-500/20 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-blue-400/30 text-center">
            <h3 className="text-2xl font-semibold text-white mb-4">⏳ Processing Payment...</h3>
            <p className="text-gray-200 mb-6">Please wait while we process your Solana payment.</p>
            <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            {transactionHash && (
              <div className="bg-black/30 rounded-lg p-4 mt-4">
                <p className="text-sm text-gray-300">
                  <span className="font-medium">Transaction Hash:</span>
                </p>
                <p className="font-mono text-xs text-blue-300 break-all mt-1">{transactionHash}</p>
              </div>
            )}
          </div>
        )}

        {paymentStatus === 'completed' && (
          <div className="bg-green-500/20 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-green-400/30 text-center">
            <h3 className="text-2xl font-semibold text-white mb-4">✅ Payment Completed!</h3>
            <p className="text-gray-200 mb-4">Your payment has been processed successfully.</p>
            {transactionHash && (
              <div className="bg-black/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-300 mb-1">
                  <span className="font-medium">Transaction Hash:</span>
                </p>
                <p className="font-mono text-xs text-green-300 break-all">{transactionHash}</p>
              </div>
            )}
            <div className="space-y-2 text-gray-200">
              <p className="font-semibold text-white">Next Step: You can now select your lottery numbers!</p>
              <p className="text-sm">Redirecting to number selection...</p>
            </div>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="bg-red-500/20 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-red-400/30">
            <h3 className="text-2xl font-semibold text-white mb-4">❌ Payment Failed</h3>
            <p className="text-gray-200 mb-6">There was an error processing your payment. Please try again.</p>
            <button
              onClick={() => setPaymentStatus('pending')}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-600/30">
          <h4 className="text-lg font-semibold text-white mb-4">Process Overview</h4>
          <ol className="space-y-2 text-gray-300 text-sm">
            <li className="flex items-start">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5">1</span>
              Connect your Solana wallet
            </li>
            <li className="flex items-start">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5">2</span>
              Send {amount} SOL to our wallet address
            </li>
            <li className="flex items-start">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5">3</span>
              Wait for payment confirmation
            </li>
            <li className="flex items-start">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5">4</span>
              Select your lottery numbers
            </li>
            <li className="flex items-start">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5">5</span>
              All data will be saved to database
            </li>
          </ol>
        </div>
        </div>
      </main>
    </>
  );
}
