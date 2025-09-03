// Mock payment system for testing without Helio
export interface MockPaymentRequest {
  amount: number;
  currency: string;
  description: string;
  metadata: {
    discordId: string;
    ticketCount: number;
  };
}

export interface MockPaymentResponse {
  id: string;
  url: string;
  status: string;
  amount: number;
  currency: string;
}

export class MockPaymentService {
  async createPayment(paymentData: MockPaymentRequest): Promise<MockPaymentResponse> {
    // Generate a mock payment ID
    const paymentId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create a mock payment URL (this would normally be a real payment page)
    // const mockUrl = `https://mock-payment.example.com/pay/${paymentId}`;
    const mockUrl = `https://app.hel.io/pay/68b88b2e016a9c59ac358597`;
    
    console.log(`   Mock Payment Created:`);
    console.log(`   ID: ${paymentId}`);
    console.log(`   Amount: ${paymentData.amount} ${paymentData.currency}`);
    console.log(`   Description: ${paymentData.description}`);
    console.log(`   Discord ID: ${paymentData.metadata.discordId}`);
    console.log(`   Ticket Count: ${paymentData.metadata.ticketCount}`);
    
    return {
      id: paymentId,
      url: mockUrl,
      status: 'pending',
      amount: paymentData.amount,
      currency: paymentData.currency
    };
  }

  async getPaymentStatus(paymentId: string): Promise<any> {
    // Mock payment status - always returns completed for testing
    return {
      id: paymentId,
      status: 'completed',
      amount: 5,
      currency: 'USDC',
      completed_at: new Date().toISOString()
    };
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    // Mock webhook verification - always returns true for testing
    console.log(' Mock webhook signature verification: PASSED');
    return true;
  }

  // Simulate payment completion after 5 seconds
  async simulatePaymentCompletion(paymentId: string, callback: (paymentId: string) => void) {
    console.log(` Simulating payment completion for ${paymentId} in 5 seconds...`);
    
    setTimeout(() => {
      console.log(`✅ Mock payment ${paymentId} completed!`);
      callback(paymentId);
    }, 5000);
  }
}

export const mockPaymentService = new MockPaymentService();
