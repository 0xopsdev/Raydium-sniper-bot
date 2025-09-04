import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/database';
import { helioService } from '@/lib/helio';
import Payment from '@/models/Payment';
import { Client } from 'discord.js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const signature = req.headers['x-helio-signature'] as string;
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    if (!helioService.verifyWebhookSignature(payload, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { id, status, metadata } = req.body;

    if (!id || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find payment record
    const payment = await Payment.findOne({ paymentId: id });
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Update payment status
    if (status === 'completed') {
      payment.status = 'completed';
      payment.completedAt = new Date();
      payment.helioTransactionId = req.body.transaction_id;
      await payment.save();

      // Notify Discord bot about successful payment
      await notifyDiscordBot(payment.discordId, payment.paymentId, metadata);

      console.log(`Payment ${id} completed for user ${payment.discordId}`);
    } else if (status === 'failed') {
      payment.status = 'failed';
      await payment.save();

      console.log(`Payment ${id} failed for user ${payment.discordId}`);
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error processing Helio webhook:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function notifyDiscordBot(discordId: string, paymentId: string, metadata: any) {
  try {
    // Import the active purchases store
    const { activePurchases } = await import('@/bot/stores/activeData');
    
    // Update the active purchase status
    const activePurchase = activePurchases.get(discordId);
    if (activePurchase) {
      activePurchase.status = 'payment_completed';
      activePurchase.paymentId = paymentId;
      activePurchases.set(discordId, activePurchase);
      
      console.log(`Updated active purchase for user ${discordId} to payment_completed`);
    }
    
    console.log(`Notifying Discord bot: Payment ${paymentId} completed for user ${discordId}`);
    
    // In a real implementation, you would send a message to the Discord bot
    // For now, the user will need to manually trigger the number selection
    
  } catch (error) {
    console.error('Error notifying Discord bot:', error);
  }
}
