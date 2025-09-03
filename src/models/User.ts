import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  discordId: string;
  walletAddress: string;
  walletType?: string;
  username: string;
  linkedAt: Date;
  isActive: boolean;
}

const UserSchema = new Schema<IUser>({
  discordId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  walletAddress: {
    type: String,
    required: true,
    index: true
  },
  walletType: {
    type: String,
    required: false
  },
  username: {
    type: String,
    required: true
  },
  linkedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
