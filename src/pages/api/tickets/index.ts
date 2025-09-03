import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/database';
import LotteryTicket from '@/models/LotteryTicket';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { discord_id, wallet_address } = req.query;

    if (!discord_id && !wallet_address) {
      return res.status(400).json({ 
        error: 'Missing required parameter: discord_id or wallet_address' 
      });
    }

    let query: any = { isActive: true };

    if (discord_id) {
      query.discordId = discord_id as string;
    }

    if (wallet_address) {
      query.walletAddress = wallet_address as string;
    }

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
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
