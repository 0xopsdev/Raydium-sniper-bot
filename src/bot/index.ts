import { Client, GatewayIntentBits, Events } from 'discord.js';
import { config } from 'dotenv';
import express from 'express';
import connectDB from '@/lib/database';

// Import handlers
import { 
  handleBuyTickets, 
  handleLinkWallet, 
  handleMyTickets, 
  handleQuickPick,
  handleSelectNumbers
} from './handlers/commandHandlers';

import {
  handlePaymentButton,
  handleNumberSelection,
  handleQuickPickButton,
  handleSubmitTicket,
  handleNumberDropdown,
  handlePowerballSelection,
  handlePaymentCompleted
} from './handlers/interactionHandlers';

// Import routes
import webRoutes from './routes/webRoutes';
import apiRoutes from './routes/apiRoutes';

// Load environment variables
config({ path: './config.env' });

// Create Express app for API endpoints
const app = express();
app.use(express.json());

// Create Discord client=============================================================>>
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
});

// Make Discord client available to routes
app.locals.discordClient = client;

// Bot ready event
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`✅ Bot is ready! Logged in as ${readyClient.user.tag}`);
  console.log(`🎯 Bot is now listening for commands on ${readyClient.guilds.cache.size} servers`);
  
  // Connect to database
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
});

// Handle connection errors
client.on(Events.Error, (error) => {
  console.error('❌ Discord client error:', error);
});

client.on(Events.Warn, (warning) => {
  console.warn('⚠️ Discord client warning:', warning);
});

// Note: Discord.js handles reconnection automatically

// Handle slash command interactions
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  // Defer reply immediately to prevent timeout
  try {
    await interaction.deferReply({ ephemeral: true });
  } catch (error) {
    console.error('Error deferring reply:', error);
    return;
  }

  try {
    switch (commandName) {
      case 'buy-tickets':
        await handleBuyTickets(interaction);
        break;
      case 'link-wallet':
        await handleLinkWallet(interaction);
        break;
      case 'my-tickets':
        await handleMyTickets(interaction);
        break;
      case 'quickpick':
        await handleQuickPick(interaction);
        break;
      case 'select-numbers':
        await handleSelectNumbers(interaction);
        break;
      default:
        await interaction.editReply({ content: '❌ Unknown command!' });
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: '❌ An error occurred while processing your request.', ephemeral: true });
      } else {
        await interaction.reply({ content: '❌ An error occurred while processing your request.', ephemeral: true });
      }
    } catch (replyError) {
      console.error('Error sending error message:', replyError);
    }
  }
});

// Handle button interactions
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  const { customId } = interaction;

  try {
    if (customId.startsWith('pay_')) {
      await handlePaymentButton(interaction);
    } else if (customId.startsWith('number_')) {
      await handleNumberSelection(interaction);
    } else if (customId === 'quickpick') {
      await handleQuickPickButton(interaction);
    } else if (customId === 'submit_ticket') {
      await handleSubmitTicket(interaction);
    } else if (customId === 'payment_completed') {
      await handlePaymentCompleted(interaction);
    }
  } catch (error) {
    console.error('Error handling button interaction:', error);
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: '❌ An error occurred while processing your request.', ephemeral: true });
      } else {
        await interaction.reply({ content: '❌ An error occurred while processing your request.', ephemeral: true });
      }
    } catch (replyError) {
      console.error('Error sending error message:', replyError);
    }
  }
});

// Handle select menu interactions
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  const { customId } = interaction;

  try {
    if (customId.startsWith('select_number_')) {
      await handleNumberDropdown(interaction);
    } else if (customId === 'select_powerball') {
      await handlePowerballSelection(interaction);
    }
  } catch (error) {
    console.error('Error handling select menu:', error);
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: '❌ An error occurred while processing your request.', ephemeral: true });
      } else {
        await interaction.reply({ content: '❌ An error occurred while processing your request.', ephemeral: true });
      }
    } catch (replyError) {
      console.error('Error sending error message:', replyError);
    }
  }
});

// Setup routes
app.use('/', webRoutes);
app.use('/api', apiRoutes);

// Start server on port 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(` API Server running on http://localhost:${PORT}`);
});

// Login to Discord with retry logic
async function loginWithRetry() {
  let retries = 0;
  const maxRetries = 5;
  
  while (retries < maxRetries) {
    try {
      console.log(`🔄 Attempting to login to Discord... (Attempt ${retries + 1}/${maxRetries})`);
      await client.login(process.env.DISCORD_BOT_TOKEN);
      break; // Success, exit the loop
    } catch (error) {
      retries++;
      console.error(`❌ Login attempt ${retries} failed:`, error);
      
      if (retries >= maxRetries) {
        console.error(' Max login retries reached. Bot failed to start.');
        process.exit(1);
      }
      
      const delay = Math.pow(2, retries) * 1000; // Exponential backoff
      console.log(`⏳ Retrying in ${delay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

loginWithRetry();

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  // Don't exit the process, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

export default client;
