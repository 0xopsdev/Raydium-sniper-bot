import { helioService } from '@/lib/helio';
import connectDB from '@/lib/database';
import { mockPaymentService } from '@/lib/mockPayment';
import { ticketGenerator } from '@/lib/ticketGenerator';
import User from '@/models/User';
import LotteryTicket from '@/models/LotteryTicket';
import Payment from '@/models/Payment';
import Session from '@/models/Session';
import { activePurchases, numberSelections, sessionTokens } from '../stores/activeData';
import { syncTicketsToBackend } from '../utils/ticketSync';

export async function handleBuyTickets(interaction: any) {
  const ticketCount = interaction.options.getInteger('number') || 1;
  const userId = interaction.user.id;
  const username = interaction.user.username;

  if (ticketCount < 1 || ticketCount > 10) {
    await interaction.editReply({
      content: '❌ You can only buy between 1-10 tickets at a time.'
    });
    return;
  }

  const ticketPrice = 5; // $5 USDC per ticket
  const totalAmount = ticketCount * ticketPrice;

  try {
    // Generate secure session token
    const sessionToken = `session_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    
    // Store ticket count for payment flow with session token
    activePurchases.set(userId, {
      ticketCount,
      currentTicket: 0,
      tickets: [],
      paymentId: '', // Will be set after payment creation
      totalAmount,
      status: 'ticket_count_selected',
      sessionToken
    });

    // Store session token in database (15 minutes expiration)
    try {
      const session = new Session({
        sessionToken,
        userId,
        ticketCount,
        totalAmount,
        expiresAt: new Date(Date.now() + (15 * 60 * 1000)), // 15 minutes
        isActive: true
      });
      await session.save();
      console.log('✅ Session saved to database:', session.sessionToken);
    } catch (error) {
      console.error('❌ Error saving session to database:', error);
      throw error;
    }

    // Create payment button that opens wallet connection and payment page
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    
    const webBaseUrl = process.env.WEB_BASE_URL || 'http://localhost:3000';
    const paymentUrl = `${webBaseUrl}/connect-wallet?token=${sessionToken}`;
    
    const payButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('💳 Connect Wallet & Pay')
          .setStyle(ButtonStyle.Link)
          .setURL(paymentUrl)
      );

    const paymentMessage = `🎫 **Step 1: Ticket Count Selected**\n\n📊 **Tickets:** ${ticketCount}\n💰 **Total Cost:** $${totalAmount} USDC\n\n**Next Step:** Click the button below to connect your wallet and send payment:`;

    await interaction.editReply({
      content: paymentMessage,
      components: [payButton]
    });

  } catch (error) {
    console.error('Error setting up ticket purchase:', error);
    await interaction.editReply({
      content: '❌ Failed to set up ticket purchase. Please try again.'
    });
  }
}

export async function handleLinkWallet(interaction: any) {
  const userId = interaction.user.id;
  const username = interaction.user.username;

  // Create a unique connection token
  const connectionToken = `connect_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Store connection token temporarily (in production, use Redis or database)
  const connectionUrl = `http://localhost:3000/connect-wallet?token=${connectionToken}&user=${userId}`;
  
  const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
  
  const connectButton = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setLabel('🔗 Connect Wallet')
        .setStyle(ButtonStyle.Link)
        .setURL(connectionUrl)
    );

  await interaction.editReply({
    content: `🔗 **Connect Your Wallet**\n\nClick the button below to connect your Solana wallet:\n\n📱 **Mobile:** Opens in your wallet app\n💻 **Desktop:** Opens in your browser\n\n⏰ **Connection expires in 10 minutes**`,
    components: [connectButton]
  });

  // Store the connection token for verification (in production, use Redis)
  // For now, we'll handle this in the web interface
}

export async function handleMyTickets(interaction: any) {
  const userId = interaction.user.id;

  try {
    // Ensure DB connection is available
    await connectDB();

    // Fetch latest 20 tickets for the user (active or not)
    const tickets = await LotteryTicket.find({
      discordId: userId,
    }).sort({ createdAt: -1 }).limit(20);

    if (tickets.length === 0) {
      await interaction.editReply({
        content: 'You don\'t have any tickets yet. Use `/buy-tickets` to purchase and then select numbers.'
      });
      return;
    }

    // Create ticket display with badge
    const webBaseUrl = process.env.WEB_BASE_URL || 'http://localhost:3000';
    const badgeUrl = `${webBaseUrl}/badge-mobile.png`;
    
    // Chunked replies to avoid 2000-char message limit
    const header = `🎫 **Your Tickets:**\n\n`;
    let buffer = header;
    const chunks: string[] = [];

    tickets.forEach((ticket, index) => {
      const line = [
        `**#${index + 1}** (${ticket.ticketId})`,
        `Numbers: ${ticket.numbers.join(', ')} | Powerball: ${ticket.powerball}`,
        `Type: ${ticket.type} | Draw: ${ticket.drawDate.toLocaleDateString()}`,
        '',
      ].join('\n');

      if ((buffer + line).length > 1800) {
        chunks.push(buffer);
        buffer = '';
      }
      buffer += line + '\n';
    });
    if (buffer.trim().length > 0) chunks.push(buffer);

    // Send first chunk with badge image
    await interaction.editReply({ 
      content: chunks[0],
      files: [{
        attachment: badgeUrl,
        name: 'badge-mobile.png'
      }]
    });
    
    // Send remaining chunks as follow-ups
    for (let i = 1; i < chunks.length; i++) {
      await interaction.followUp({ content: chunks[i], ephemeral: true });
    }
    
    // Send web link as a follow-up
    const webLink = `${webBaseUrl}/?discord_id=${userId}`;
    await interaction.followUp({
      content: `🌐 **View your tickets online:** ${webLink}`,
      ephemeral: true
    });

  } catch (error) {
    console.error('Error fetching tickets:', error);
    await interaction.editReply({
      content: '❌ Failed to fetch your tickets. Please try again.'
    });
  }
}

export async function handleQuickPick(interaction: any) {
  const userId = interaction.user.id;
  
  // Check if user has an active purchase
  const activePurchase = activePurchases.get(userId);
  if (!activePurchase) {
    await interaction.editReply({
      content: '❌ No active ticket purchase found. Use `/buy-tickets` first.'
    });
    return;
  }

  const { numbers, powerball } = ticketGenerator.generateRandomNumbers();
  
  // Store the quickpick selection
  numberSelections.set(userId, {
    mainNumbers: numbers,
    powerball,
    isComplete: true
  });

  await interaction.reply({
    content: `**QuickPick Generated!**\n\n🔢 **Numbers:** ${numbers.join(', ')}\n **Powerball:** ${powerball}\n\nClick "Submit Ticket" to confirm or use the number picker to customize.`,
    ephemeral: true
  });
}

export async function handleSelectNumbers(interaction: any) {
  const userId = interaction.user.id;
  
  // Check if user has an active purchase with completed payment
  const activePurchase = activePurchases.get(userId);
  if (!activePurchase) {
    await interaction.editReply({
      content: '❌ No active ticket purchase found. Use `/buy-tickets` first.'
    });
    return;
  }

  if (activePurchase.status !== 'payment_completed') {
    await interaction.editReply({
      content: '❌ Payment not completed yet. Please complete payment first.'
    });
    return;
  }

  // Import the payment completed handler
  const { handlePaymentCompleted } = await import('./interactionHandlers');
  
  // Create a mock interaction object for the handler
  const mockInteraction = {
    ...interaction,
    reply: interaction.editReply
  };

  await handlePaymentCompleted(mockInteraction);
}
