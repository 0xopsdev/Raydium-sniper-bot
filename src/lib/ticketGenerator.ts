import QRCode from 'qrcode';
import { LotteryTicket } from '@/types';

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
    // For now, return a simple text representation
    // In production, you would use canvas or another image library
    const ticketText = `
    CRYPTO LOTTERY TICKET
    Ticket ID: #${ticket.ticketId}
    🔢 Your Numbers: ${ticket.numbers.join(', ')} 🎯 ${ticket.powerball}
    📅 Draw Date: ${ticket.drawDate.toLocaleDateString()}
    JACKPOT: $${jackpotAmount.toLocaleString()} USDC
    🔗 www.cryptolottery.xyz
    Share this on social and tag @CryptoLottery
    `;
    
    return Buffer.from(ticketText, 'utf-8');
  }
}

export const ticketGenerator = new TicketImageGenerator();