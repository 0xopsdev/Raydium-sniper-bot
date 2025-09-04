import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/database';
import { helioService } from '@/lib/helio';
import { mockPaymentService } from '@/lib/mockPayment';
import Payment from '@/models/Payment';
import User from '@/models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { discordId, amount, ticketCount, walletAddress } = req.body;

    // Validate required fields
    if (!discordId || !amount || !ticketCount || !walletAddress) {
      return res.status(400).json({ 
        error: 'Missing required fields: discordId, amount, ticketCount, walletAddress' 
      });
    }

    // Check if user exists or create new user
    let user = await User.findOne({ discordId });
    if (!user) {
      user = new User({
        discordId,
        walletAddress,
        username: `User_${discordId}`,
        isActive: true
      });
      await user.save();
    } else {
      // Update wallet address if different
      if (user.walletAddress !== walletAddress) {
        user.walletAddress = walletAddress;
        await user.save();
      }
    }

    // Create payment with Helio or Mock service
    const paymentData = {
      amount: parseFloat(amount),
      currency: 'USDC',
      description: `Crypto Lottery - ${ticketCount} ticket(s)`,
      metadata: {
        discordId: discordId,
        ticketCount: parseInt(ticketCount)
      }
    };

    // Use mock service if Helio credentials are not set
    const useMockPayment = !process.env.HELIO_API_KEY || 
                          process.env.HELIO_API_KEY === 'your_helio_api_key_here' ||
                          process.env.HELIO_API_KEY === '';
    
    let payment;
    try {
      payment = useMockPayment 
        ? await mockPaymentService.createPayment(paymentData)
        : await helioService.createPayment(paymentData);
    } catch (error) {
      console.log('Helio API failed, falling back to mock payment:', error);
      payment = await mockPaymentService.createPayment(paymentData);
    }

    // Store payment in database
    const paymentRecord = new Payment({
      paymentId: payment.id,
      discordId: discordId,
      amount: parseFloat(amount),
      currency: 'USDC',
      status: 'pending',
      ticketCount: parseInt(ticketCount),
      walletAddress: walletAddress
    });
    await paymentRecord.save();

    res.status(200).json({
      success: true,
      paymentId: payment.id,
      amount: amount,
      ticketCount: ticketCount,
      useMockPayment: useMockPayment
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
