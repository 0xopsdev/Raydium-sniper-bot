import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  sessionToken: string;
  userId: string;
  ticketCount: number;
  totalAmount: number;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

const SessionSchema = new Schema<ISession>({
  sessionToken: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  ticketCount: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

export default mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
