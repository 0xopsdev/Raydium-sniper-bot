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
    
    const webBaseUrl = process.env.WEB_BASE_URL || '';
    const paymentUrl = `${webBaseUrl}/connect-wallet?token=${sessionToken}`;
    
    const payButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('💳 Connect Wallet & Pay')
          .setStyle(ButtonStyle.Link)
          .setURL(paymentUrl)
      );

    // Create beautiful embed for ticket purchase
    const purchaseEmbed = {
      title: '🎫 Crypto Lottery - Ticket Purchase',
      description: `Ready to buy **${ticketCount}** lottery ticket${ticketCount > 1 ? 's' : ''}?`,
      color: 0xff6b35, // Orange color
      thumbnail: {
        url: `${webBaseUrl}/badge-mobile.png`
      },
      fields: [
        {
          name: '🎰 Ticket Details',
          value: `**Quantity:** ${ticketCount} ticket${ticketCount > 1 ? 's' : ''}\n**Price per ticket:** $5.00 USDC\n**Total Cost:** **$${totalAmount} USDC**`,
          inline: true
        },
        {
          name: '🎲 What You Get',
          value: `• ${ticketCount} lottery ticket${ticketCount > 1 ? 's' : ''} with your chosen numbers\n• Chance to win the jackpot\n• Beautiful ticket display online`,
          inline: true
        },
        {
          name: '💳 Payment Method',
          value: 'Connect your Solana wallet and send USDC payment',
          inline: false
        }
      ],
      footer: {
        text: 'Crypto Lottery • Secure blockchain payment',
        icon_url: `${webBaseUrl}/badge-mobile.png`
      },
      timestamp: new Date().toISOString()
    };

    await interaction.editReply({
      embeds: [purchaseEmbed],
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

    // Create beautiful Discord embeds for tickets
    const webBaseUrl = process.env.WEB_BASE_URL || '';

    if (tickets.length === 0) {
      const noTicketsEmbed = {
        title: '🎫 No Tickets Found',
        description: 'You don\'t have any lottery tickets yet!',
        color: 0xff6b6b, // Red color
        thumbnail: {
          url: `${webBaseUrl}/badge-mobile.png`
        },
        fields: [
          {
            name: '🚀 Get Started',
            value: 'Use `/buy-tickets` to purchase your first lottery tickets!',
            inline: false
          },
          {
            name: '💰 Ticket Price',
            value: 'Only **$5.00 USDC** per ticket',
            inline: true
          },
          {
            name: '🎲 How It Works',
            value: '1. Buy tickets\n2. Select your numbers\n3. Wait for the draw!',
            inline: true
          }
        ],
        footer: {
          text: 'Crypto Lottery • Start your winning journey!',
          icon_url: `${webBaseUrl}/badge-mobile.png`
        },
        timestamp: new Date().toISOString()
      };

      await interaction.editReply({ embeds: [noTicketsEmbed] });
      return;
    }
    const webLink = `${webBaseUrl}/?discord_id=${userId}`;
    
    // Create main embed
    const mainEmbed = {
      title: '🎫 Your Lottery Tickets',
      description: `You have **${tickets.length}** ticket(s) for the upcoming draw!`,
      color: 0x00ff00, // Green color
      thumbnail: {
        url: `${webBaseUrl}/badge-mobile.png`
      },
      fields: [
        {
          name: '🌐 View Online',
          value: `[Click here to see your tickets](${webLink})`,
          inline: false
        }
      ],
      footer: {
        text: 'Crypto Lottery • Use /buy-tickets to get more!',
        icon_url: `${webBaseUrl}/badge-mobile.png`
      },
      timestamp: new Date().toISOString()
    };

    // Send main embed
    await interaction.editReply({ embeds: [mainEmbed] });

    // Create individual ticket embeds - each ticket gets its own embed for maximum clarity
    const ticketEmbeds = [];
    
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      const numbersDisplay = ticket.numbers.map((num: number) => `**__${num.toString().padStart(2, '0')}__**`).join(' • ');
      const powerballDisplay = `**__${ticket.powerball.toString().padStart(2, '0')}__**`;
      
      const embed = {
        title: `🎫 TICKET : ${i + 1} - ${ticket.ticketId}`,
        description: `**⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘⚘**`,
        color: ticket.type === 'quickpick' ? 0x00ff88 : 0x4a90e2, // Green for quickpick, blue for manual
        thumbnail: {
          url: `${webBaseUrl}/badge-mobile.png`
        },
        fields: [
          {
            name: `🔢 MAIN NUMBERS`,
            value: `\`\`\`ansi\n${ticket.numbers.map((num: number) => `\u001b[31m\u001b[1m${num.toString().padStart(2, '0')}\u001b[0m`).join(' • ')}\`\`\``,
            inline: true
          },
          {
            name: `🎱 POWERBALL`,
            value: `\`\`\`ansi\n\u001b[31m\u001b[1m${ticket.powerball.toString().padStart(2, '0')}\u001b[0m\`\`\``,
            inline: true
          },
          {
            name: `📅 DRAW DATE`,
            value: ticket.drawDate.toLocaleDateString(),
            inline: true
          },
          {
            name: `🎯 TICKET TYPE`,
            value: ticket.type === 'quickpick' ? '🎲 Quick Pick' : '✋ Manual Selection',
            inline: true
          },
          {
            name: `⏰ PURCHASED`,
            value: ticket.createdAt.toLocaleDateString(),
            inline: true
          },
          {
            name: `💰 TICKET VALUE`,
            value: '$5.00 USDC',
            inline: true
          }
        ],
        footer: {
          text: `Crypto Lottery • Ticket ${i + 1} of ${tickets.length}`,
          icon_url: `${webBaseUrl}/badge-mobile.png`
        },
        timestamp: new Date().toISOString()
      };
      
      ticketEmbeds.push(embed);
    }

    // Send individual ticket embeds as follow-ups (max 10 per batch to avoid rate limits)
    const maxEmbedsPerBatch = 10;
    for (let i = 0; i < ticketEmbeds.length; i += maxEmbedsPerBatch) {
      const batch = ticketEmbeds.slice(i, i + maxEmbedsPerBatch);
      await interaction.followUp({ 
        embeds: batch, 
        ephemeral: true 
      });
      
      // Small delay between batches to avoid rate limits
      if (i + maxEmbedsPerBatch < ticketEmbeds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

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
