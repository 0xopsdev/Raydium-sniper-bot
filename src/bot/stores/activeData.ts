// Store active ticket purchases
export const activePurchases = new Map<string, {
  ticketCount: number;
  currentTicket: number;
  tickets: any[];
  paymentId: string;
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
