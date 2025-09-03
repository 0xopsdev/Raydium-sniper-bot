import { helioService } from '@/lib/helio';
import { mockPaymentService } from '@/lib/mockPayment';
import { ticketGenerator } from '@/lib/ticketGenerator';
import User from '@/models/User';
import LotteryTicket from '@/models/LotteryTicket';
import Payment from '@/models/Payment';
import { activePurchases, numberSelections } from '../stores/activeData';
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

    // Create payment button with dynamic payment link
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    
    // Generate dynamic payment link (Helio or Coinbase)
    // const paymentUrl = useMockPayment 
    //   ? `https://mock-payment.example.com/pay/${payment.id}`
    //   : payment.url; // Use Helio's payment URL
    const paymentUrl = "https://app.hel.io/pay/68b88b2e016a9c59ac358597";
    
    const payButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('💳 Pay Now')
          .setStyle(ButtonStyle.Link)
          .setURL(paymentUrl)
      );

    const paymentMessage = useMockPayment 
      ? `🎫 **Awesome! To purchase ${ticketCount} ticket(s), please send **$${totalAmount} USDC**\n\n🎭 **MOCK PAYMENT MODE** - This is a test payment that will auto-complete in 5 seconds!\n\n💰 **Send USDC to:** \`EPnmEdiLyv38zZ2Fq9ma3NvejjzsDh8YJnUQwf98i3MY\`\n\n🔗 **Your Connected Wallet:** \`${user.walletAddress}\`\n\n⏰ Payment will auto-complete for testing.`
      : `🎫 **Awesome! To purchase ${ticketCount} ticket(s), please send **$${totalAmount} USDC**\n\n💰 **Send USDC to:** \`EPnmEdiLyv38zZ2Fq9ma3NvejjzsDh8YJnUQwf98i3MY\`\n\n🔗 **Your Connected Wallet:** \`${user.walletAddress}\`\n\n⏰ Payment expires in 15 minutes.`;

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
        
        // Notify user that payment is complete and start number selection
        try {
          const user = await interaction.client.users.fetch(userId);
          await user.send(`✅ **Payment received!** Your payment of $${totalAmount} USDC has been processed.\n\n💰 **Payment received at:** \`EPnmEdiLyv38zZ2Fq9ma3NvejjzsDh8YJnUQwf98i3MY\`\n\n🎫 **Let's choose your ticket numbers!** Use the number picker below to select your lottery numbers.`);
          
          // Trigger number selection flow
          await startNumberSelectionFlow(interaction.client, userId, ticketCount, payment.id);
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
  const userId = interaction.user.id;
  const username = interaction.user.username;
  const walletAddress = interaction.options.getString('address');

  if (!walletAddress) {
    await interaction.editReply({
      content: '❌ Please provide your wallet address.\n\n**Usage:** `/link-wallet [wallet_address]`\n\n**Example:** `/link-wallet 8x2f...Z9WQ`'
    });
    return;
  }

  // Basic wallet address validation (Solana addresses are 32-44 characters)
  if (walletAddress.length < 32 || walletAddress.length > 44) {
    await interaction.editReply({
      content: '❌ Invalid wallet address format. Please provide a valid Solana wallet address.'
    });
    return;
  }

  try {
    // Check if user already has a linked wallet
    const existingUser = await User.findOne({ discordId: userId, isActive: true });
    
    if (existingUser) {
      // Update existing user's wallet address
      existingUser.walletAddress = walletAddress;
      existingUser.username = username;
      await existingUser.save();
      
      await interaction.editReply({
        content: `✅ **Wallet Updated!**\n\n🔗 **New Wallet:** \`${walletAddress}\`\n👤 **Discord User:** ${username}\n\n🎫 **Ready to buy tickets!** Use \`/buy-tickets [number]\` to purchase lottery tickets.`
      });
    } else {
      // Create new user record
      const newUser = new User({
        discordId: userId,
        walletAddress: walletAddress,
        username: username,
        isActive: true
      });
      await newUser.save();
      
      await interaction.editReply({
        content: `✅ **Wallet Linked Successfully!**\n\n🔗 **Wallet Address:** \`${walletAddress}\`\n👤 **Discord User:** ${username}\n\n🎫 **Ready to buy tickets!** Use \`/buy-tickets [number]\` to purchase lottery tickets.`
      });
    }

  } catch (error) {
    console.error('Error linking wallet:', error);
    await interaction.editReply({
      content: '❌ Failed to link wallet. Please try again or contact support.'
    });
  }
}

export async function handleMyTickets(interaction: any) {
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

// Start number selection flow after payment completion
export async function startNumberSelectionFlow(client: any, userId: string, ticketCount: number, paymentId: string) {
  try {
    const user = await client.users.fetch(userId);
    
    // Initialize active purchase
    activePurchases.set(userId, {
      ticketCount,
      currentTicket: 0,
      tickets: [],
      paymentId
    });

    // Clear any existing number selection
    numberSelections.delete(userId);

    // Create number selection interface
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
    
    // Create number buttons (1-69) in rows of 10
    const numberRows = [];
    for (let i = 0; i < 7; i++) {
      const row = new ActionRowBuilder();
      for (let j = 1; j <= 10; j++) {
        const number = i * 10 + j;
        if (number <= 69) {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`number_${number}`)
              .setLabel(number.toString())
              .setStyle(ButtonStyle.Secondary)
          );
        }
      }
      numberRows.push(row);
    }

    // Create powerball dropdown
    const powerballOptions = [];
    for (let i = 1; i <= 25; i++) {
      powerballOptions.push({
        label: `Powerball ${i}`,
        value: i.toString(),
        description: `Select ${i} as your Powerball number`
      });
    }

    const powerballRow = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('select_powerball')
          .setPlaceholder('🎯 Select Powerball (1-25)')
          .addOptions(powerballOptions)
      );

    // Create action buttons
    const actionRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('quickpick')
          .setLabel('🎲 QuickPick')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('submit_ticket')
          .setLabel('✅ Submit Ticket')
          .setStyle(ButtonStyle.Success)
          .setDisabled(true)
      );

    const allRows = [...numberRows, powerballRow, actionRow];

    await user.send({
      content: `🎫 **Ticket 1 of ${ticketCount}**\n\n🔢 **Select 5 numbers (1-69):**\n🎯 **Select 1 Powerball (1-25):**\n\n**Current Selection:** \`No numbers selected\`\n\nClick the numbers below or use QuickPick for random numbers!`,
      components: allRows
    });

  } catch (error) {
    console.error('Error starting number selection flow:', error);
  }
}
