export interface LotteryTicket {
  _id?: string;
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

export interface User {
  _id?: string;
  discordId: string;
  walletAddress: string;
  username: string;
  linkedAt: Date;
  isActive: boolean;
}

export interface Payment {
  _id?: string;
  paymentId: string;
  discordId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  helioTransactionId?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface TicketPurchase {
  discordId: string;
  discord_id: string;
  walletAddress: string;
  wallet_address: string;
  tickets: {
    numbers: number[];
    powerball: number;
    type: 'manual' | 'quickpick';
  }[];
  paymentId: string;
  payment_id: string;
  timestamp: string;
}

export interface DiscordInteraction {
  type: number;
  data?: {
    name: string;
    options?: any[];
  };
  member?: {
    user: {
      id: string;
      username: string;
    };
  };
  user?: {
    id: string;
    username: string;
  };
}

export interface NumberSelection {
  mainNumbers: number[];
  powerball: number;
  isComplete: boolean;
}
