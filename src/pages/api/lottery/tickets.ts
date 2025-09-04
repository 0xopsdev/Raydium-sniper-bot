import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/database';
import User from '@/models/User';
import LotteryTicket from '@/models/LotteryTicket';
import Payment from '@/models/Payment';
import { TicketPurchase } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { wallet_address, discord_id, tickets, payment_id, timestamp }: TicketPurchase = req.body;

    // Validate required fields
    if (!discord_id || !tickets || !payment_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: discord_id, tickets, payment_id' 
      });
    }

    // Resolve wallet address: prefer request value, otherwise pull from user's linked wallet
    let walletAddressToUse = wallet_address;

    if (!walletAddressToUse) {
      const userById = await User.findOne({ discordId: discord_id, isActive: true });
      if (!userById) {
        return res.status(404).json({ error: 'User not found or wallet not linked' });
      }
      walletAddressToUse = userById.walletAddress;
    } else {
      // If provided, ensure it matches user's linked wallet
      const user = await User.findOne({ discordId: discord_id, isActive: true });
      if (!user || user.walletAddress !== walletAddressToUse) {
        return res.status(400).json({ error: 'Wallet does not match linked user wallet' });
      }
    }

    // Verify payment exists and is completed
    const payment = await Payment.findOne({ 
      paymentId: payment_id,
      status: 'completed'
    });

    if (!payment) {
      return res.status(400).json({ 
        error: 'Payment not found or not completed' 
      });
    }

    // Validate ticket data
    for (const ticket of tickets) {
      if (!ticket.numbers || ticket.numbers.length !== 5) {
        return res.status(400).json({ 
          error: 'Each ticket must have exactly 5 numbers' 
        });
      }

      if (!ticket.powerball || ticket.powerball < 1 || ticket.powerball > 25) {
        return res.status(400).json({ 
          error: 'Powerball must be between 1-25' 
        });
      }

      for (const number of ticket.numbers) {
        if (number < 1 || number > 69) {
          return res.status(400).json({ 
            error: 'Numbers must be between 1-69' 
          });
        }
      }

      // Check for duplicate numbers
      const uniqueNumbers = new Set(ticket.numbers);
      if (uniqueNumbers.size !== 5) {
        return res.status(400).json({ 
          error: 'Numbers must be unique' 
        });
      }
    }

    // Create tickets in database
    const drawDate = new Date();
    drawDate.setDate(drawDate.getDate() + 7); // Next week's draw

    const createdTickets = [] as any[];

    for (const ticketData of tickets) {
      const ticketId = generateTicketId();
      
      const ticket = new LotteryTicket({
        discordId: discord_id,
        walletAddress: walletAddressToUse,
        numbers: ticketData.numbers.sort((a, b) => a - b),
        powerball: ticketData.powerball,
        type: ticketData.type,
        paymentId: payment_id,
        ticketId,
        drawDate,
        isActive: true
      });

      await ticket.save();
      createdTickets.push(ticket);
    }

    res.status(200).json({
      success: true,
      message: `${tickets.length} tickets created successfully`,
      tickets: createdTickets.map(ticket => ({
        ticketId: ticket.ticketId,
        numbers: ticket.numbers,
        powerball: ticket.powerball,
        type: ticket.type,
        drawDate: ticket.drawDate,
        paymentId: ticket.paymentId,
        discordId: ticket.discordId,
        walletAddress: ticket.walletAddress
      }))
    });

  } catch (error) {
    console.error('Error creating tickets:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function generateTicketId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
