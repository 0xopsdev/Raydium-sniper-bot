import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';

// Load environment variables
config({ path: './config.env' });

const commands = [
  {
    name: 'buy-tickets',
    description: 'Purchase lottery tickets with crypto',
    options: [
      {
        name: 'number',
        description: 'Number of tickets to buy (1-10)',
        type: 4, // INTEGER
        required: true,
        min_value: 1,
        max_value: 10
      }
    ]
  },
  {
    name: 'link-wallet',
    description: 'Link your wallet address to your Discord account',
    options: [
      {
        name: 'address',
        description: 'Your Solana wallet address',
        type: 3, // STRING
        required: true
      }
    ]
  },
  {
    name: 'my-tickets',
    description: 'View your recent lottery tickets'
  },
  {
    name: 'quickpick',
    description: 'Generate random numbers for your ticket'
  }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN!);

(async () => {
  try {
    console.log('🔄 Started refreshing application (/) commands.');

    // Register commands globally
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
      { body: commands }
    );

    console.log('✅ Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
})();
