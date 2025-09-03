import User from '@/models/User';
import LotteryTicket from '@/models/LotteryTicket';
import Payment from '@/models/Payment';
import { ticketGenerator } from '@/lib/ticketGenerator';

// Sync tickets to backend via API
export async function syncTicketsToBackend(activePurchase: any, userId: string) {
  try {
    const user = await User.findOne({ discordId: userId });
    if (!user) throw new Error('User not found');

    // Prepare ticket data for API
    const ticketPurchaseData = {
      wallet_address: user.walletAddress,
      discord_id: userId,
      tickets: activePurchase.tickets.map((ticketData: any) => ({
        numbers: ticketData.numbers,
        powerball: ticketData.powerball,
        type: ticketData.type
      })),
      payment_id: activePurchase.paymentId,
      timestamp: new Date().toISOString()
    };

    // Call backend API to create tickets
    const response = await fetch('http://localhost:3000/api/lottery/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ticketPurchaseData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log(`✅ Successfully synced ${result.tickets.length} tickets to backend for user ${userId}`);

    // Generate and send ticket images for each created ticket
    for (const ticketInfo of result.tickets) {
      try {
        // Create ticket object for image generation
        const ticketForImage = {
          ticketId: ticketInfo.ticketId,
          numbers: ticketInfo.numbers,
          powerball: ticketInfo.powerball,
          drawDate: new Date(ticketInfo.drawDate),
          type: ticketInfo.type
        };

        const imageBuffer = await ticketGenerator.generateTicketImage(ticketForImage);
        
        // Send ticket image to user via Discord
        const { AttachmentBuilder } = require('discord.js');
        const attachment = new AttachmentBuilder(imageBuffer, { name: `ticket_${ticketInfo.ticketId}.png` });
        
        // Get Discord client and send image
        const discordClient = (global as any).discordClient;
        if (discordClient) {
          const user = await discordClient.users.fetch(userId);
          await user.send({
            content: `🎉 **Here's your official lottery ticket!**\n\n🎫 **Ticket #${ticketInfo.ticketId}**\n🔢 **Numbers:** ${ticketInfo.numbers.join(', ')} | **Powerball:** ${ticketInfo.powerball}\n📅 **Draw Date:** ${new Date(ticketInfo.drawDate).toLocaleDateString()}\n\n📸 **Share this on social media and tag @CryptoLottery!**`,
            files: [attachment]
          });
        }
        
        console.log(`✅ Generated and sent ticket image for ${ticketInfo.ticketId}`);
      } catch (error) {
        console.error('Error generating/sending ticket image:', error);
      }
    }

    // Update payment status
    await Payment.findOneAndUpdate(
      { paymentId: activePurchase.paymentId },
      { status: 'completed', completedAt: new Date() }
    );

    console.log(`🎟️ All ${activePurchase.tickets.length} tickets submitted and synced!`);

  } catch (error) {
    console.error('Error syncing tickets to backend:', error);
    throw error;
  }
}
