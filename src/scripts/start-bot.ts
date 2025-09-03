import { spawn } from 'child_process';
import path from 'path';

console.log('🚀 Starting Crypto Lottery Discord Bot...');

// Start the Discord bot
const botProcess = spawn('tsx', [path.join(__dirname, '../bot/index.ts')], {
  stdio: 'inherit',
  env: { ...process.env }
});

botProcess.on('error', (error) => {
  console.error('❌ Error starting bot:', error);
});

botProcess.on('exit', (code) => {
  console.log(`Bot process exited with code ${code}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down bot...');
  botProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down bot...');
  botProcess.kill('SIGTERM');
  process.exit(0);
});
