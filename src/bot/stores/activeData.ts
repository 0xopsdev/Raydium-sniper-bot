// Store active ticket purchases
export const activePurchases = new Map<string, {
  ticketCount: number;
  currentTicket: number;
  tickets: any[];
  paymentId: string;
  totalAmount: number;
  status: 'ticket_count_selected' | 'payment_pending' | 'payment_completed' | 'number_selection' | 'completed';
  sessionToken: string;
}>();

// Store secure session tokens
export const sessionTokens = new Map<string, {
  userId: string;
  ticketCount: number;
  totalAmount: number;
  createdAt: number;
  expiresAt: number;
}>();

// Store number selections
export const numberSelections = new Map<string, {
  mainNumbers: number[];
  powerball: number;
  isComplete: boolean;
}>();

// Store connection tokens temporarily (in production, use Redis)
export const connectionTokens = new Map<string, { userId: string; expires: number }>();

// Store payment sessions temporarily
export const paymentSessions = new Map<string, { 
  userId: string; 
  amount: number; 
  ticketCount: number; 
  expires: number;
  userWallet: string | null;
}>();
