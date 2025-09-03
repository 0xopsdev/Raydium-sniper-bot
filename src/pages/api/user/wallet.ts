import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/database';
import User from '@/models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { discord_id } = req.query;

    if (!discord_id) {
      return res.status(400).json({ 
        error: 'Missing required parameter: discord_id' 
      });
    }

    const user = await User.findOne({ 
      discordId: discord_id as string,
      isActive: true
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found or wallet not linked' 
      });
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
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
