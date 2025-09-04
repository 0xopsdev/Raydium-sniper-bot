import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/database';
import LotteryTicket from '@/models/LotteryTicket';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { discord_id } = req.query;

    if (!discord_id) {
      return res.status(400).json({ error: 'Discord ID is required' });
    }

    // Fetch tickets for the user
    const tickets = await LotteryTicket.find({ 
      discordId: discord_id 
    }).sort({ createdAt: -1 }).limit(50); // Get latest 50 tickets

    res.status(200).json({
      success: true,
      tickets: tickets,
      count: tickets.length
    });

  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
