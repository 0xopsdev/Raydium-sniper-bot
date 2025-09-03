import mongoose, { Schema, Document } from 'mongoose';

export interface ILotteryTicket extends Document {
  discordId: string;
  walletAddress: string;
  numbers: number[];
  powerball: number;
  type: 'manual' | 'quickpick';
  paymentId: string;
  ticketId: string;
  drawDate: Date;
  createdAt: Date;
  isActive: boolean;
}

const LotteryTicketSchema = new Schema<ILotteryTicket>({
  discordId: {
    type: String,
    required: true,
    index: true
  },
  walletAddress: {
    type: String,
    required: true,
    index: true
  },
  numbers: {
    type: [Number],
    required: true,
    validate: {
      validator: function(numbers: number[]) {
        return numbers.length === 5 && numbers.every(n => n >= 1 && n <= 69);
      },
      message: 'Numbers must be 5 values between 1-69'
    }
  },
  powerball: {
    type: Number,
    required: true,
    min: 1,
    max: 25
  },
  type: {
    type: String,
    enum: ['manual', 'quickpick'],
    required: true
  },
  paymentId: {
    type: String,
    required: true,
    index: true
  },
  ticketId: {
    type: String,
    required: true,
    unique: true
  },
  drawDate: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

export default mongoose.models.LotteryTicket || mongoose.model<ILotteryTicket>('LotteryTicket', LotteryTicketSchema);
