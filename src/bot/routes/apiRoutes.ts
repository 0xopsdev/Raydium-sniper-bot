import express from 'express';
import connectDB from '@/lib/database';
import { solanaWalletService } from '@/lib/solanaWallet';
import User from '@/models/User';
import LotteryTicket from '@/models/LotteryTicket';
import Payment from '@/models/Payment';
import { connectionTokens, paymentSessions } from '../stores/activeData';

const router = express.Router();

// Wallet validation endpoint
router.post('/validate-wallet', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    const walletInfo = await solanaWalletService.getWalletInfo(address);
    
    res.json({
      valid: true,
      address: walletInfo.address,
      balance: walletInfo.balance
    });
  } catch (error) {
    console.error('Error validating wallet:', error);
    res.json({
      valid: false,
      error: error
    });
  }
});

// Wallet balance endpoint
router.post('/wallet-balance', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    const balance = await solanaWalletService.getWalletBalance(address);
    
    res.json({
      balance: balance
    });
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    res.status(500).json({ error: 'Failed to get wallet balance' });
  }
});

// Create transaction endpoint
router.post('/create-transaction', async (req, res) => {
  try {
    const { token, fromAddress, toAddress, amount } = req.body;
    
    console.log('Creating transaction:', { token, fromAddress, toAddress, amount });
    
    if (!token || !fromAddress || !toAddress || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get payment session
    const paymentSession = paymentSessions.get(token);
    if (!paymentSession || paymentSession.expires < Date.now()) {
      return res.status(400).json({ error: 'Payment session expired or not found' });
    }
    
    // Check if user has enough SOL
    const hasEnoughSOL = await solanaWalletService.hasEnoughSOL(fromAddress, amount);
    
    if (!hasEnoughSOL) {
      const currentBalance = await solanaWalletService.getWalletBalance(fromAddress);
      return res.json({ 
        success: false, 
        error: `Insufficient SOL balance. Required: ${amount.toFixed(6)} SOL, Available: ${currentBalance.toFixed(6)} SOL` 
      });
    }
    
    // Create transaction
    const transaction = await solanaWalletService.createTransferTransaction(fromAddress, toAddress, amount);
    const recentBlockhash = await solanaWalletService.getRecentBlockhash();
    
    // Set transaction properties
    transaction.recentBlockhash = recentBlockhash;
    transaction.feePayer = new (require('@solana/web3.js')).PublicKey(fromAddress);
    
    // Serialize transaction for frontend
    const serializedTransaction = transaction.serialize({ requireAllSignatures: false }).toString('base64');
    
    console.log('Transaction created successfully');
    
    res.json({ 
      success: true, 
      transaction: serializedTransaction,
      message: 'Transaction created successfully' 
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) });
  }
});

// Confirm payment endpoint
router.post('/confirm-payment', async (req, res) => {
  try {
    const { token, userWallet } = req.body;
    
    if (!token || !userWallet) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get payment session
    const paymentSession = paymentSessions.get(token);
    if (!paymentSession || paymentSession.expires < Date.now()) {
      return res.status(400).json({ error: 'Payment session expired or not found' });
    }
    
    // Calculate required SOL amount (assuming $100 per SOL for demo)
    const requiredSOL = paymentSession.amount / 100;
    
    // Check if user has enough SOL
    const hasEnoughSOL = await solanaWalletService.hasEnoughSOL(userWallet, requiredSOL);
    
    if (!hasEnoughSOL) {
      // Get current balance to show user
      const currentBalance = await solanaWalletService.getWalletBalance(userWallet);
      
      // Send insufficient funds message to user in Discord
      try {
        const user = await req.app.locals.discordClient.users.fetch(paymentSession.userId);
        await user.send(`❌ **Insufficient SOL Balance!**\n\n💰 **Required:** ${requiredSOL.toFixed(6)} SOL\n💳 **Your Balance:** ${currentBalance.toFixed(6)} SOL\n\n🔗 **Please use another wallet or add more SOL to your current wallet.**\n\nYou can get free SOL from the Solana devnet faucet: https://faucet.solana.com/`);
      } catch (error) {
        console.error('Error sending insufficient funds message:', error);
      }
      
      return res.json({ 
        success: false, 
        error: `Insufficient SOL balance. Required: ${requiredSOL.toFixed(6)} SOL, Available: ${currentBalance.toFixed(6)} SOL` 
      });
    }
    
    // User has enough SOL, proceed with payment
    // For now, we'll simulate the transfer (in production, you'd use the wallet to sign and send the transaction)
    console.log(`Payment approved: ${requiredSOL.toFixed(6)} SOL from ${userWallet} to EPnmEdiLyv38zZ2Fq9ma3NvejjzsDh8YJnUQwf98i3MY`);
    
    // Update payment status in database
    await Payment.findOneAndUpdate(
      { paymentId: token },
      { status: 'completed', completedAt: new Date() }
    );
    
    // Clean up payment session
    paymentSessions.delete(token);
    
    // Send confirmation message to user in Discord
    try {
      const user = await req.app.locals.discordClient.users.fetch(paymentSession.userId);
      await user.send(`✅ **Payment Transferred Successfully!**\n\n💰 **Amount:** $${paymentSession.amount} USDC (${requiredSOL.toFixed(6)} SOL)\n🎫 **Tickets:** ${paymentSession.ticketCount} ticket(s)\n\n🎲 **You can now pick your lottery numbers!** Use the number picker in Discord to choose your numbers for each ticket.`);
    } catch (error) {
      console.error('Error sending payment confirmation:', error);
    }
    
    res.json({ success: true, message: 'Payment confirmed successfully' });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Confirm wallet connection endpoint
router.post('/confirm-wallet', async (req, res) => {
  try {
    await connectDB();
    const { token, walletAddress, walletType } = req.body;
    
    if (!token || !walletAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Verify token
    const tokenData = connectionTokens.get(token);
    if (!tokenData || tokenData.expires < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    
    const userId = tokenData.userId;
    
    // Check if wallet is already linked to another user
    const existingUser = await User.findOne({ walletAddress });
    if (existingUser && existingUser.discordId !== userId) {
      return res.status(400).json({ error: 'This wallet is already linked to another Discord account' });
    }
    
    // Update or create user
    await User.findOneAndUpdate(
      { discordId: userId },
      {
        discordId: userId,
        walletAddress,
        walletType,
        linkedAt: new Date(),
        isActive: true
      },
      { upsert: true, new: true }
    );
    
    // Clean up token
    connectionTokens.delete(token);
    
    // Send confirmation message to user in Discord
    try {
      const user = await req.app.locals.discordClient.users.fetch(userId);
      const walletInfo = await solanaWalletService.getWalletInfo(walletAddress);
      await user.send(`✅ **Wallet Connected Successfully!**\n\n🔗 **Wallet Address:** \`${walletAddress}\`\n💰 **Balance:** ${walletInfo.balance.toFixed(4)} SOL\n\n🎫 **You can now buy lottery tickets!** Use \`/buy-tickets\` to purchase tickets with your connected wallet.`);
    } catch (error) {
      console.error('Error sending wallet connection confirmation:', error);
      // Send a simpler message if balance check fails
      try {
        const user = await req.app.locals.discordClient.users.fetch(userId);
        await user.send(`✅ **Wallet Connected Successfully!**\n\n🔗 **Wallet Address:** \`${walletAddress}\`\n\n🎫 **You can now buy lottery tickets!** Use \`/buy-tickets\` to purchase tickets with your connected wallet.`);
      } catch (sendError) {
        console.error('Error sending fallback confirmation:', sendError);
      }
    }
    
    res.json({ success: true, message: 'Wallet connected successfully' });
  } catch (error) {
    console.error('Error confirming wallet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user wallet endpoint
router.get('/user/wallet', async (req, res) => {
  try {
    await connectDB();
    const { discord_id } = req.query;
    
    if (!discord_id) {
      return res.status(400).json({ error: 'Missing required parameter: discord_id' });
    }

    const user = await User.findOne({ 
      discordId: discord_id as string,
      isActive: true
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found or wallet not linked' });
    }

    res.status(200).json({
      success: true,
      user: {
        discordId: user.discordId,
        walletAddress: user.walletAddress,
        username: user.username,
        linkedAt: user.linkedAt
      }
    });
  } catch (error) {
    console.error('Error fetching user wallet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tickets endpoint
router.get('/tickets', async (req, res) => {
  try {
    await connectDB();
    const { discord_id, wallet_address } = req.query;

    if (!discord_id && !wallet_address) {
      return res.status(400).json({ error: 'Missing required parameter: discord_id or wallet_address' });
    }

    let query: any = { isActive: true };
    if (discord_id) query.discordId = discord_id as string;
    if (wallet_address) query.walletAddress = wallet_address as string;

    const tickets = await LotteryTicket.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      tickets: tickets.map(ticket => ({
        ticketId: ticket.ticketId,
        numbers: ticket.numbers,
        powerball: ticket.powerball,
        type: ticket.type,
        drawDate: ticket.drawDate,
        createdAt: ticket.createdAt,
        paymentId: ticket.paymentId
      }))
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helio webhook endpoint
router.post('/webhooks/helio', async (req, res) => {
  try {
    await connectDB();
    const { id, status, metadata } = req.body;

    if (!id || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const payment = await Payment.findOne({ paymentId: id });
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (status === 'completed') {
      payment.status = 'completed';
      payment.completedAt = new Date();
      payment.helioTransactionId = req.body.transaction_id;
      await payment.save();
      console.log(`Payment ${id} completed for user ${payment.discordId}`);
    } else if (status === 'failed') {
      payment.status = 'failed';
      await payment.save();
      console.log(`Payment ${id} failed for user ${payment.discordId}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing Helio webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
