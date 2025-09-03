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
    // Import the startNumberSelectionFlow function
    const { startNumberSelectionFlow } = await import('@/bot/handlers/commandHandlers');
    
    // Get the Discord client from the app locals
    const discordClient = (global as any).discordClient;
    
    if (!discordClient) {
      console.error('Discord client not available');
      return;
    }

    // Get ticket count from metadata
    const ticketCount = metadata?.ticketCount || 1;
    
    // Notify user that payment is complete
    const user = await discordClient.users.fetch(discordId);
    await user.send(`✅ **Payment received!** Your payment has been processed.\n\n🎫 **Let's choose your ticket numbers!** Use the number picker below to select your lottery numbers.`);
    
    // Start the number selection flow
    await startNumberSelectionFlow(discordClient, discordId, ticketCount, paymentId);
    
    console.log(`✅ Discord bot notified: Payment ${paymentId} completed for user ${discordId}, starting number selection for ${ticketCount} tickets`);
    
  } catch (error) {
    console.error('Error notifying Discord bot:', error);
  }
}
