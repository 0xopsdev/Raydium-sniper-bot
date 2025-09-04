import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/database';
import User from '@/models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectDB();

    if (req.method === 'GET') {
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

      return res.status(200).json({
        success: true,
        user: {
          discordId: user.discordId,
          walletAddress: user.walletAddress,
          username: user.username,
          linkedAt: user.linkedAt
        }
      });
    }

    if (req.method === 'POST') {
      const {
        discordId,
        walletAddress,
        walletType,
        username
      } = req.body || {};

      if (!discordId || !walletAddress) {
        return res.status(400).json({
          error: 'Missing required fields: discordId, walletAddress'
        });
      }

      // Upsert user record
      const updated = await User.findOneAndUpdate(
        { discordId },
        {
          discordId,
          walletAddress,
          walletType: walletType || 'Unknown',
          username: username || `User_${discordId}`,
          isActive: true,
          linkedAt: new Date()
        },
        { new: true, upsert: true }
      );

      return res.status(200).json({
        success: true,
        user: {
          discordId: updated.discordId,
          walletAddress: updated.walletAddress,
          walletType: updated.walletType,
          username: updated.username,
          linkedAt: updated.linkedAt
        }
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in user wallet handler:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
