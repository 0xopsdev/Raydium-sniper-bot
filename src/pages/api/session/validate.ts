import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/database';
import Session from '@/models/Session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Starting session validation...');
    await connectDB();
    console.log('✅ Database connected');
    
    const { token } = req.body;
    console.log('🔍 Validating session token:', token);

    if (!token) {
      console.log('❌ No token provided');
      return res.status(400).json({ error: 'Missing token' });
    }

    // Find session in database
    console.log('🔍 Searching for session in database...');
    const session = await Session.findOne({
      sessionToken: token,
      isActive: true,
      expiresAt: { $gt: new Date() } // Not expired
    });

    console.log('🔍 Found session:', session ? 'YES' : 'NO');
    if (session) {
      console.log('Session details:', {
        userId: session.userId,
        ticketCount: session.ticketCount,
        totalAmount: session.totalAmount,
        isActive: session.isActive,
        expiresAt: session.expiresAt
      });
    }

    if (!session) {
      // Check if session exists but is expired
      console.log('🔍 Checking for expired session...');
      const expiredSession = await Session.findOne({ sessionToken: token });
      console.log('🔍 Expired session check:', expiredSession ? 'FOUND' : 'NOT FOUND');
      if (expiredSession) {
        console.log('Expired session details:', {
          isActive: expiredSession.isActive,
          expiresAt: expiredSession.expiresAt,
          isExpired: expiredSession.expiresAt < new Date()
        });
      }
      return res.status(404).json({ error: 'Invalid or expired session' });
    }

    // Return session data
    res.status(200).json({
      success: true,
      session: {
        userId: session.userId,
        ticketCount: session.ticketCount,
        totalAmount: session.totalAmount,
        timeRemaining: Math.max(0, session.expiresAt.getTime() - Date.now())
      }
    });

  } catch (error) {
    console.error('Error validating session:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
