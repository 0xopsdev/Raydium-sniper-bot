import { config } from 'dotenv';
import connectDB from '@/lib/database';

// Load environment variables
config({ path: './config.env' });

async function testSetup() {
  console.log('🧪 Testing Crypto Lottery Discord Bot Setup...\n');

  // Test environment variables
  console.log('📋 Environment Variables:');
  const requiredEnvVars = [
    'DISCORD_BOT_TOKEN',
    'DISCORD_CLIENT_ID',
    'DISCORD_PUBLIC_KEY',
    'MONGODB_URI',
    'HELIO_API_KEY',
    'HELIO_WEBHOOK_SECRET'
  ];

  let envVarsValid = true;
  requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    if (value && value !== `your_${envVar.toLowerCase()}_here`) {
      console.log(`✅ ${envVar}: Set`);
    } else {
      console.log(`❌ ${envVar}: Not set or using placeholder`);
      envVarsValid = false;
    }
  });

  if (!envVarsValid) {
    console.log('\n⚠️  Please update your environment variables in config.env');
    return;
  }

  // Test database connection
  console.log('\nTesting Database Connection:');
  try {
    await connectDB();
    console.log('✅ Database connection successful');
  } catch (error) {
    console.log('❌ Database connection failed:', error);
    return;
  }

  // Test imports
  console.log('\n Testing Imports:');
  try {
    const { helioService } = await import('@/lib/helio');
    console.log('✅ Helio service imported successfully');
    
    const { ticketGenerator } = await import('@/lib/ticketGenerator');
    console.log('✅ Ticket generator imported successfully');
    
    const User = (await import('@/models/User')).default;
    console.log('✅ User model imported successfully');
    
    const LotteryTicket = (await import('@/models/LotteryTicket')).default;
    console.log('✅ LotteryTicket model imported successfully');
    
    const Payment = (await import('@/models/Payment')).default;
    console.log('✅ Payment model imported successfully');
  } catch (error) {
    console.log('❌ Import error:', error);
    return;
  }

  // Test ticket generation
  console.log('\nTesting Ticket Generation:');
  try {
    const { ticketGenerator } = await import('@/lib/ticketGenerator');
    const ticketId = ticketGenerator.generateTicketId();
    const randomNumbers = ticketGenerator.generateRandomNumbers();
    
    console.log(`✅ Generated ticket ID: ${ticketId}`);
    console.log(`✅ Generated numbers: ${randomNumbers.numbers.join(', ')} | Powerball: ${randomNumbers.powerball}`);
  } catch (error) {
    console.log('❌ Ticket generation error:', error);
  }

  console.log('\nSetup test completed!');
  console.log('\nNext Steps:');
  console.log('1. Run: npm run register-commands');
  console.log('2. Run: npm run dev (for Next.js app)');
  console.log('3. Run: npm run dev:bot (for Discord bot)');
  console.log('4. Invite bot to your Discord server');
  console.log('5. Test with /buy-tickets command');
}

testSetup().catch(console.error);
