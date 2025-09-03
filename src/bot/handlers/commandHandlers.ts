import { helioService } from '@/lib/helio';
import { mockPaymentService } from '@/lib/mockPayment';
import { ticketGenerator } from '@/lib/ticketGenerator';
import User from '@/models/User';
import LotteryTicket from '@/models/LotteryTicket';
import Payment from '@/models/Payment';
import { activePurchases, numberSelections } from '../stores/activeData';
import { syncTicketsToBackend } from '../utils/ticketSync';

export async function handleBuyTickets(interaction: any) {
  // Acknowledge the interaction immediately to prevent timeout
  await interaction.deferReply({ ephemeral: true });
  
  const ticketCount = interaction.options.getInteger('number') || 1;
  const userId = interaction.user.id;
  const username = interaction.user.username;

  if (ticketCount < 1 || ticketCount > 10) {
    await interaction.editReply({
      content: '❌ You can only buy between 1-10 tickets at a time.'
    });
    return;
  }

  // Check if user has linked wallet
  const user = await User.findOne({ discordId: userId, isActive: true });
  if (!user) {
    await interaction.editReply({
      content: '❌ Please connect your wallet first using `/link-wallet` command.'
    });
    return;
  }

  const ticketPrice = 5; // $5 USDC per ticket
  const totalAmount = ticketCount * ticketPrice;

  try {
    // Create payment with Helio or Mock service
    const paymentData = {
      amount: totalAmount,
      currency: 'USDC',
      description: `Crypto Lottery - ${ticketCount} ticket(s)`,
      metadata: {
        discordId: userId,
        ticketCount: ticketCount
      }
    };

    // Use mock service if Helio credentials are not set or if there's a connection error
    const useMockPayment = !process.env.HELIO_API_KEY || 
                          process.env.HELIO_API_KEY === 'your_helio_api_key_here' ||
                          process.env.HELIO_API_KEY === '';
    
    let payment;
    try {
      payment = useMockPayment 
        ? await mockPaymentService.createPayment(paymentData)
        : await helioService.createPayment(paymentData);
    } catch (error) {
      console.log('Helio API failed, falling back to mock payment:', error);
      payment = await mockPaymentService.createPayment(paymentData);
    }

    // Store payment in database
    const paymentRecord = new Payment({
      paymentId: payment.id,
      discordId: userId,
      amount: totalAmount,
      currency: 'USDC',
      status: 'pending'
    });
    await paymentRecord.save();

    // Store active purchase
    activePurchases.set(userId, {
      ticketCount,
      currentTicket: 0,
      tickets: [],
      paymentId: payment.id
    });

    // Create payment button that opens our payment page
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    
    const paymentUrl = `http://localhost:3000/pay?token=${payment.id}&amount=${totalAmount}&user=${userId}`;
    
    const payButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('💳 Pay Now')
          .setStyle(ButtonStyle.Link)
          .setURL(paymentUrl)
      );

    const paymentMessage = useMockPayment 
      ? ` **Awesome! To purchase ${ticketCount} ticket(s), please send **$${totalAmount} USDC**\n\n🎭 **MOCK PAYMENT MODE** - This is a test payment that will auto-complete in 5 seconds!\n\n💰 **Send USDC to:** \`EPnmEdiLyv38zZ2Fq9ma3NvejjzsDh8YJnUQwf98i3MY\`\n\n🔗 **Your Connected Wallet:** \`${user.walletAddress}\` (${user.walletType || 'Unknown'})\n\n⏰ Payment will auto-complete for testing.`
      : ` **Awesome! To purchase ${ticketCount} ticket(s), please send **$${totalAmount} USDC**\n\n💰 **Send USDC to:** \`EPnmEdiLyv38zZ2Fq9ma3NvejjzsDh8YJnUQwf98i3MY\`\n\n🔗 **Your Connected Wallet:** \`${user.walletAddress}\` (${user.walletType || 'Unknown'})\n\n⏰ Payment expires in 15 minutes.`;

    await interaction.editReply({
      content: paymentMessage,
      components: [payButton]
    });

    // If using mock payment, simulate completion
    if (useMockPayment) {
      mockPaymentService.simulatePaymentCompletion(payment.id, async (completedPaymentId) => {
        // Update payment status in database
        await Payment.findOneAndUpdate(
          { paymentId: completedPaymentId },
          { status: 'completed', completedAt: new Date() }
        );
        
        // Notify user that payment is complete
        try {
          const user = await interaction.client.users.fetch(userId);
          await user.send(`✅ **Payment Completed!** Your payment of $${totalAmount} USDC has been processed.\n\n💰 **Payment received at:** \`EPnmEdiLyv38zZ2Fq9ma3NvejjzsDh8YJnUQwf98i3MY\`\n\n🎫 You can now select your lottery numbers!`);
        } catch (error) {
          console.error('Error sending payment completion message:', error);
        }
      });
    }

  } catch (error) {
    console.error('Error creating payment:', error);
    await interaction.editReply({
      content: '❌ Failed to create payment. Please try again.'
    });
  }
}

export async function handleLinkWallet(interaction: any) {
  await interaction.deferReply({ ephemeral: true });
  
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
  await interaction.deferReply({ ephemeral: true });
  
  const userId = interaction.user.id;

  try {
    const tickets = await LotteryTicket.find({ 
      discordId: userId, 
      isActive: true 
    }).sort({ createdAt: -1 }).limit(10);

    if (tickets.length === 0) {
      await interaction.editReply({
        content: 'You don\'t have any active tickets. Use `/buy-tickets` to purchase some!'
      });
      return;
    }

    let response = ' **Your Recent Tickets:**\n\n';
    
    tickets.forEach((ticket, index) => {
      const numbers = ticket.numbers.join(', ');
      response += `**Ticket #${index + 1}** (${ticket.ticketId})\n`;
      response += ` Numbers: ${numbers} |  Powerball: ${ticket.powerball}\n`;
      response += ` Draw: ${ticket.drawDate.toLocaleDateString()}\n`;
      response += ` Type: ${ticket.type}\n\n`;
    });

    await interaction.editReply({
      content: response
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
    await interaction.reply({
      content: '❌ No active ticket purchase found. Use `/buy-tickets` first.',
      ephemeral: true
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
