import { Client, GatewayIntentBits, Events } from 'discord.js';
import { config } from 'dotenv';
import express from 'express';
import connectDB from '@/lib/database';

// Import handlers
import { 
  handleBuyTickets, 
  handleLinkWallet, 
  handleMyTickets, 
  handleQuickPick 
} from './handlers/commandHandlers';

import {
  handlePaymentButton,
  handleNumberSelection,
  handleQuickPickButton,
  handleSubmitTicket,
  handleNumberDropdown,
  handlePowerballSelection
} from './handlers/interactionHandlers';

// Import routes
import webRoutes from './routes/webRoutes';
import apiRoutes from './routes/apiRoutes';

// Load environment variables
config({ path: './config.env' });

// Create Express app for API endpoints
const app = express();
app.use(express.json());

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
});

// Make Discord client available to routes
app.locals.discordClient = client;

// Bot ready event
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`🚀 Bot is ready! Logged in as ${readyClient.user.tag}`);
  
  // Connect to database
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
});

// Handle slash command interactions
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

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
      default:
        await interaction.reply({ content: '❌ Unknown command!', ephemeral: true });
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
    await interaction.reply({ content: '❌ An error occurred while processing your request.', ephemeral: true });
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
    }
  } catch (error) {
    console.error('Error handling button interaction:', error);
    await interaction.reply({ content: '❌ An error occurred while processing your request.', ephemeral: true });
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
    await interaction.reply({ content: '❌ An error occurred while processing your request.', ephemeral: true });
  }
});

// Setup routes
app.use('/', webRoutes);
app.use('/api', apiRoutes);

// Start server on port 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
});

// Login to Discord
client.login(process.env.DISCORD_BOT_TOKEN);

export default client;
