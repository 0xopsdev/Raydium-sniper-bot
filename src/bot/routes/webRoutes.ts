import express from 'express';
import { solanaWalletService } from '@/lib/solanaWallet';
import User from '@/models/User';
import { connectionTokens, paymentSessions } from '../stores/activeData';

const router = express.Router();

// Wallet connection page
router.get('/connect-wallet', (req, res) => {
  const { token, user } = req.query;
  
  if (!token || !user) {
    return res.status(400).send('Invalid connection request');
  }
  
  // Store token with expiration (10 minutes)
  connectionTokens.set(token as string, {
    userId: user as string,
    expires: Date.now() + 10 * 60 * 1000
  });
  
  // Serve the wallet connection page
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Connect Wallet - Crypto Lottery</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; background: #1a1a1a; color: white; }
        .container { background: #2a2a2a; padding: 30px; border-radius: 15px; text-align: center; }
        .connect-btn { background: #5865f2; color: white; border: none; padding: 20px 40px; border-radius: 10px; font-size: 18px; cursor: pointer; width: 100%; margin: 20px 0; }
        .connect-btn:hover { background: #4752c4; }
        .connect-btn:disabled { background: #666; cursor: not-allowed; }
        .status { margin: 20px 0; padding: 15px; border-radius: 8px; }
        .success { background: #2d5a2d; }
        .error { background: #5a2d2d; }
        .info { background: #2d4a5a; }
        .wallet-info { background: #333; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .wallet-address { font-family: monospace; word-break: break-all; margin: 10px 0; }
        .balance { color: #4CAF50; font-weight: bold; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔗 Connect Wallet</h1>
        <p>Connect your Solana wallet to buy lottery tickets</p>
        
        <div id="status" class="status info">
          Click the button below to connect your wallet
        </div>
        
        <button class="connect-btn" onclick="connectWallet()" id="connect-btn">
          🔗 Connect Wallet
        </button>
        
        <div id="wallet-info" class="wallet-info" style="display: none;">
          <h3>✅ Wallet Connected!</h3>
          <div class="wallet-address" id="wallet-address"></div>
          <div class="balance" id="wallet-balance"></div>
          <button class="connect-btn" onclick="confirmConnection()" style="background: #2d5a2d;">
            ✅ Confirm & Return to Discord
          </button>
        </div>
      </div>
      
      <script>
        let walletAddress = null;
        let walletBalance = 0;
        
        async function connectWallet() {
          const status = document.getElementById('status');
          const connectBtn = document.getElementById('connect-btn');
          
          status.className = 'status info';
          status.textContent = 'Connecting to wallet...';
          connectBtn.disabled = true;
          connectBtn.textContent = 'Connecting...';
          
          try {
            // Try to connect to available wallet
            let wallet = null;
            let walletType = 'unknown';
            
            // Check for Phantom first
            if (window.solana && window.solana.isPhantom) {
              wallet = window.solana;
              walletType = 'phantom';
            }
            // Check for Solflare
            else if (window.solflare) {
              wallet = window.solflare;
              walletType = 'solflare';
            }
            // Check for Backpack
            else if (window.backpack) {
              wallet = window.backpack;
              walletType = 'backpack';
            }
            else {
              throw new Error('No Solana wallet found. Please install Phantom, Solflare, or Backpack wallet.');
            }
            
            // Connect to wallet
            const response = await wallet.connect();
            walletAddress = response.publicKey.toString();
            
            // Get wallet balance
            try {
              const balanceResponse = await fetch('/api/wallet-balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: walletAddress })
              });
              const balanceData = await balanceResponse.json();
              walletBalance = balanceData.balance || 0;
            } catch (error) {
              console.error('Error getting balance:', error);
              walletBalance = 0;
            }
            
            // Show connected wallet info
            document.getElementById('wallet-address').textContent = walletAddress;
            document.getElementById('wallet-balance').textContent = \`Balance: \${walletBalance.toFixed(4)} SOL\`;
            document.getElementById('wallet-info').style.display = 'block';
            
            status.className = 'status success';
            status.textContent = '✅ Wallet connected successfully!';
            connectBtn.style.display = 'none';
            
          } catch (error) {
            status.className = 'status error';
            status.textContent = '❌ ' + error.message;
            connectBtn.disabled = false;
            connectBtn.textContent = '🔗 Connect Wallet';
          }
        }
        
        async function confirmConnection() {
          const status = document.getElementById('status');
          status.className = 'status info';
          status.textContent = 'Confirming connection...';
          
          try {
            const response = await fetch('/api/confirm-wallet', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: '${token}',
                walletAddress: walletAddress,
                walletType: 'connected'
              })
            });
            
            const result = await response.json();
            
            if (result.success) {
              status.className = 'status success';
              status.textContent = '✅ Wallet connected! You can now close this window and return to Discord.';
            } else {
              status.className = 'status error';
              status.textContent = '❌ ' + result.error;
            }
          } catch (error) {
            status.className = 'status error';
            status.textContent = '❌ Failed to confirm connection: ' + error.message;
          }
        }
      </script>
    </body>
    </html>
  `);
});

// Payment page
router.get('/pay', async (req, res) => {
  const { token, amount, user } = req.query;
  
  if (!token || !amount || !user) {
    return res.status(400).send('Invalid payment request');
  }
  
  try {
    // Get user's connected wallet
    const userRecord = await User.findOne({ discordId: user as string, isActive: true });
    if (!userRecord) {
      return res.status(400).send('User wallet not found. Please connect your wallet first.');
    }
    
    // Store payment session (15 minutes)
    paymentSessions.set(token as string, {
      userId: user as string,
      amount: parseFloat(amount as string),
      ticketCount: Math.floor(parseFloat(amount as string) / 5), // $5 per ticket
      expires: Date.now() + 15 * 60 * 1000,
      userWallet: userRecord.walletAddress
    });
    
    // Calculate SOL amount (assuming $100 per SOL for demo)
    const solAmount = parseFloat(amount as string) / 100;
    const yourWallet = 'EPnmEdiLyv38zZ2Fq9ma3NvejjzsDh8YJnUQwf98i3MY';
    
    // Get user's current SOL balance
    let userBalance = 0;
    try {
      userBalance = await solanaWalletService.getWalletBalance(userRecord.walletAddress);
    } catch (error) {
      console.error('Error getting user balance:', error);
    }
    
    // Serve the payment page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pay for Lottery Tickets - Crypto Lottery</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; background: #1a1a1a; color: white; }
          .container { background: #2a2a2a; padding: 30px; border-radius: 15px; text-align: center; }
          .pay-btn { background: #4CAF50; color: white; border: none; padding: 20px 40px; border-radius: 10px; font-size: 18px; cursor: pointer; width: 100%; margin: 20px 0; }
          .pay-btn:hover { background: #45a049; }
          .pay-btn:disabled { background: #666; cursor: not-allowed; }
          .status { margin: 20px 0; padding: 15px; border-radius: 8px; }
          .success { background: #2d5a2d; }
          .error { background: #5a2d2d; }
          .info { background: #2d4a5a; }
          .payment-info { background: #333; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .wallet-address { font-family: monospace; word-break: break-all; margin: 10px 0; padding: 10px; background: #444; border-radius: 5px; }
          .amount { font-size: 24px; font-weight: bold; color: #4CAF50; margin: 15px 0; }
          .copy-btn { background: #5865f2; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; margin-left: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1> Pay for Lottery Tickets</h1>
          
                     <div class="payment-info">
             <h3>Payment Details:</h3>
             <div class="amount">$${amount} USDC</div>
             <p>For ${Math.floor(parseFloat(amount as string) / 5)} lottery ticket(s)</p>
             
             <h3>Send SOL to:</h3>
             <div class="wallet-address" id="wallet-address">
               ${yourWallet}
               <button class="copy-btn" onclick="copyAddress()">📋 Copy</button>
             </div>
             
             <h3>Amount to Send:</h3>
             <div class="amount">${solAmount.toFixed(6)} SOL</div>
             
             <h3>Your Wallet:</h3>
             <div class="wallet-address">${userRecord.walletAddress}</div>
             
             <h3>Your Current Balance:</h3>
             <div class="amount" style="color: ${userBalance >= solAmount ? '#4CAF50' : '#f44336'}">
               ${userBalance.toFixed(6)} SOL
               ${userBalance >= solAmount ? '✅' : '❌'}
             </div>
           </div>
           
           <div id="status" class="status ${userBalance >= solAmount ? 'info' : 'error'}">
             ${userBalance >= solAmount 
               ? `Send ${solAmount.toFixed(6)} SOL from your wallet to complete payment`
               : `❌ Insufficient balance! You need ${solAmount.toFixed(6)} SOL but only have ${userBalance.toFixed(6)} SOL`
             }
           </div>
           
           <button class="pay-btn" onclick="sendPayment()" id="pay-btn" ${userBalance < solAmount ? 'disabled' : ''}>
             💳 Pay ${solAmount.toFixed(6)} SOL
           </button>
          
          <div id="payment-info" style="display: none; margin-top: 20px;">
            <button class="pay-btn" onclick="confirmPayment()" style="background: #2d5a2d;">
              ✅ Confirm Payment Sent
            </button>
          </div>
        </div>
        
        <script>
          let connectedWallet = null;
          let walletAddress = '${userRecord.walletAddress}';
          
          // Auto-connect to wallet on page load
          window.addEventListener('load', async () => {
            await connectToWallet();
          });
          
          async function connectToWallet() {
            try {
              // Try to connect to available wallet
              let wallet = null;
              
              if (window.solana && window.solana.isPhantom) {
                wallet = window.solana;
              } else if (window.solflare) {
                wallet = window.solflare;
              } else if (window.backpack) {
                wallet = window.backpack;
              } else {
                console.log('No Solana wallet found, user will need to send manually');
                return;
              }
              
              // Connect to wallet
              const response = await wallet.connect();
              walletAddress = response.publicKey.toString();
              connectedWallet = wallet;
              
              console.log('Wallet connected:', walletAddress);
              
            } catch (error) {
              console.error('Error connecting wallet:', error);
            }
          }
          
          async function sendPayment() {
            const status = document.getElementById('status');
            const payBtn = document.getElementById('pay-btn');
            
            status.className = 'status info';
            status.textContent = 'Preparing payment...';
            payBtn.disabled = true;
            payBtn.textContent = 'Preparing...';
            
            try {
              if (!connectedWallet) {
                throw new Error('Wallet not connected. Please connect your wallet first.');
              }
              
              // Create transaction
              const response = await fetch('/api/create-transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  token: '${token}',
                  fromAddress: walletAddress,
                  toAddress: '${yourWallet}',
                  amount: ${solAmount}
                })
              });
              
              const result = await response.json();
              
              if (!result.success) {
                throw new Error(result.error);
              }
              
              // Deserialize transaction
              const transactionBuffer = Buffer.from(result.transaction, 'base64');
              const transaction = require('@solana/web3.js').Transaction.from(transactionBuffer);
              
              // Sign and send transaction
              const { signature } = await connectedWallet.signAndSendTransaction(transaction);
              
              status.className = 'status success';
              status.textContent = \`✅ Payment sent! Transaction: \${signature}\`;
              
              // Automatically confirm payment after successful transaction
              setTimeout(async () => {
                await confirmPayment();
              }, 2000);
              
            } catch (error) {
              console.error('Payment error:', error);
              status.className = 'status error';
              status.textContent = '❌ ' + error.message;
              payBtn.disabled = false;
              payBtn.textContent = '💳 Pay ${solAmount.toFixed(6)} SOL';
            }
          }
          
          function copyAddress() {
            navigator.clipboard.writeText('${yourWallet}').then(() => {
              const copyBtn = document.querySelector('.copy-btn');
              if (copyBtn) {
                copyBtn.textContent = '✅ Copied!';
                setTimeout(() => {
                  copyBtn.textContent = '📋 Copy';
                }, 2000);
              }
            }).catch(err => {
              console.error('Failed to copy address:', err);
            });
          }
          
          async function confirmPayment() {
            const status = document.getElementById('status');
            status.className = 'status info';
            status.textContent = 'Confirming payment...';
            
            try {
              const response = await fetch('/api/confirm-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  token: '${token}',
                  userWallet: walletAddress
                })
              });
              
              const result = await response.json();
              
              if (result.success) {
                status.className = 'status success';
                status.textContent = '✅ Payment confirmed! Your SOL has been transferred to our wallet. You can now close this window and return to Discord to pick your lottery numbers!';
              } else {
                status.className = 'status error';
                status.textContent = '❌ ' + result.error;
              }
            } catch (error) {
              status.className = 'status error';
              status.textContent = '❌ Failed to confirm payment: ' + error.message;
            }
          }
          
          function copyAddress() {
            const address = '${yourWallet}';
            navigator.clipboard.writeText(address).then(() => {
              alert('Wallet address copied to clipboard!');
            });
          }
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error loading payment page:', error);
    res.status(500).send('Error loading payment page');
  }
});

export default router;
