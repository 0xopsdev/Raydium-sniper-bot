import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/database';
import Payment from '@/models/Payment';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { paymentId, transactionHash, status } = req.body;

    // Validate required fields
    if (!paymentId || !status) {
      return res.status(400).json({ 
        error: 'Missing required fields: paymentId, status' 
      });
    }

    // Find and update payment record
    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      return res.status(404).json({ 
        error: 'Payment not found' 
      });
    }

    // Update payment status
    payment.status = status;
    if (transactionHash) {
      payment.helioTransactionId = transactionHash;
    }
    if (status === 'completed') {
      payment.completedAt = new Date();
    }
    
    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully'
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
