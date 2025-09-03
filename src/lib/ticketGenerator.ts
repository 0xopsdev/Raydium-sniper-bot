import QRCode from 'qrcode';
import { LotteryTicket } from '@/types';

// Canvas imports with fallback
let createCanvas: any, loadImage: any, registerFont: any;
try {
  const canvas = require('canvas');
  createCanvas = canvas.createCanvas;
  loadImage = canvas.loadImage;
  registerFont = canvas.registerFont;
} catch (error) {
  console.log('Canvas not available, using fallback text generation');
}

export class TicketImageGenerator {
  generateTicketId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  generateRandomNumbers(): { numbers: number[], powerball: number } {
    const numbers: number[] = [];
    
    // Generate 5 unique numbers between 1-69
    while (numbers.length < 5) {
      const num = Math.floor(Math.random() * 69) + 1;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    
    numbers.sort((a, b) => a - b);
    
    // Generate powerball between 1-25
    const powerball = Math.floor(Math.random() * 25) + 1;
    
    return { numbers, powerball };
  }

  async generateTicketImage(ticket: LotteryTicket, jackpotAmount: number = 1000000): Promise<Buffer> {
    try {
      // Check if canvas is available
      if (!createCanvas) {
        throw new Error('Canvas not available');
      }

      // Create canvas
      const canvas = createCanvas(800, 600);
      const ctx = canvas.getContext('2d');

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 800, 600);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 800, 600);

      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🎟️ CRYPTO LOTTERY TICKET', 400, 80);

      // Ticket ID
      ctx.font = 'bold 24px Arial';
      ctx.fillText(`Ticket ID: #${ticket.ticketId}`, 400, 130);

      // Numbers section
      ctx.font = 'bold 32px Arial';
      ctx.fillText('🔢 Your Numbers:', 400, 200);

      // Main numbers
      const numbersText = ticket.numbers.join('  ');
      ctx.font = 'bold 36px Arial';
      ctx.fillStyle = '#00ff88';
      ctx.fillText(`➡️  ${numbersText}  🎯 ${ticket.powerball}`, 400, 250);

      // Draw date
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(`📅 Draw Date: ${ticket.drawDate.toLocaleDateString()}`, 400, 320);

      // Jackpot
      ctx.font = 'bold 28px Arial';
      ctx.fillStyle = '#ffd700';
      ctx.fillText(`💸 JACKPOT: $${jackpotAmount.toLocaleString()} USDC`, 400, 380);

      // Website
      ctx.fillStyle = '#00bfff';
      ctx.font = 'bold 20px Arial';
      ctx.fillText('🔗 www.cryptolottery.xyz', 400, 430);

      // Social sharing
      ctx.fillStyle = '#ffffff';
      ctx.font = '18px Arial';
      ctx.fillText('📸 Share this on social and tag @CryptoLottery', 400, 480);

      // Generate QR code
      const qrCodeDataURL = await QRCode.toDataURL('https://www.cryptolottery.xyz');
      const qrImage = await loadImage(qrCodeDataURL);
      
      // Draw QR code
      ctx.drawImage(qrImage, 50, 450, 100, 100);

      // Border
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, 780, 580);

      return canvas.toBuffer('image/png');
    } catch (error) {
      console.error('Error generating ticket image:', error);
      // Fallback to text representation
      const ticketText = `
🎟️ CRYPTO LOTTERY TICKET
Ticket ID: #${ticket.ticketId}
🔢 Your Numbers: ${ticket.numbers.join(', ')} 🎯 ${ticket.powerball}
📅 Draw Date: ${ticket.drawDate.toLocaleDateString()}
💸 JACKPOT: $${jackpotAmount.toLocaleString()} USDC
🔗 www.cryptolottery.xyz
📸 Share this on social and tag @CryptoLottery
      `;
      return Buffer.from(ticketText, 'utf-8');
    }
  }
}

export const ticketGenerator = new TicketImageGenerator();