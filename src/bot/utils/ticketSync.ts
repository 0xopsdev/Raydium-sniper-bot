import User from '@/models/User';
import LotteryTicket from '@/models/LotteryTicket';
import Payment from '@/models/Payment';
import { ticketGenerator } from '@/lib/ticketGenerator';

// Sync tickets to backend
export async function syncTicketsToBackend(activePurchase: any, userId: string) {
  try {
    const user = await User.findOne({ discordId: userId });
    if (!user) throw new Error('User not found');

    const drawDate = new Date();
    drawDate.setDate(drawDate.getDate() + 7); // Next week's draw

    // Create tickets in database
    for (const ticketData of activePurchase.tickets) {
      const ticketId = ticketGenerator.generateTicketId();
      
      const ticket = new LotteryTicket({
        discordId: userId,
        walletAddress: user.walletAddress,
        numbers: ticketData.numbers,
        powerball: ticketData.powerball,
        type: ticketData.type,
        paymentId: activePurchase.paymentId,
        ticketId,
        drawDate,
        isActive: true
      });

      await ticket.save();

      // Generate and send ticket image
      try {
        const imageBuffer = await ticketGenerator.generateTicketImage(ticket);
        // In a real implementation, you would send this image to the user
        console.log(`Generated ticket image for ${ticketId}`);
      } catch (error) {
        console.error('Error generating ticket image:', error);
      }
    }

    // Update payment status
    await Payment.findOneAndUpdate(
      { paymentId: activePurchase.paymentId },
      { status: 'completed', completedAt: new Date() }
    );

    console.log(`Successfully synced ${activePurchase.tickets.length} tickets for user ${userId}`);

  } catch (error) {
    console.error('Error syncing tickets to backend:', error);
    throw error;
  }
}
