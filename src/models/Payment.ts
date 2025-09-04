import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  paymentId: string;
  discordId: string;
  amount: number;
  currency: string;
  ticketCount?: number;
  walletAddress?: string;
  status: 'pending' | 'completed' | 'failed';
  helioTransactionId?: string;
  createdAt: Date;
  completedAt?: Date;
}

const PaymentSchema = new Schema<IPayment>({
  paymentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  discordId: {
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'USDC'
  },
  ticketCount: {
    type: Number,
  },
  walletAddress: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  helioTransactionId: {
    type: String,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
});

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
