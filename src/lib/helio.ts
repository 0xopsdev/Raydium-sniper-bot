import axios from 'axios';

export interface HelioPaymentRequest {
  amount: number;
  currency: string;
  description: string;
  metadata: {
    discordId: string;
    ticketCount: number;
  };
  successUrl?: string;
  cancelUrl?: string;
}

export interface HelioPaymentResponse {
  id: string;
  url: string;
  status: string;
  amount: number;
  currency: string;
}

export class HelioPaymentService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.HELIO_API_KEY || '';
    this.baseUrl = 'https://api.hel.io/v1';
  }

  async createPayment(paymentData: HelioPaymentRequest): Promise<HelioPaymentResponse> {
    try {
      // Generate a unique payment ID
      const paymentId = `helio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // For now, let's use a simple payment page instead of Helio's complex API
      // This creates a direct payment link to our own payment page
      const baseUrl = `${process.env.API_BASE_URL || 'http://localhost:3000'}/payment`;
      const params = new URLSearchParams({
        token: paymentId,
        amount: paymentData.amount.toString(),
        user: paymentData.metadata.discordId,
        payment: 'true',
        currency: paymentData.currency,
        description: paymentData.description
      });

      const paymentUrl = `${baseUrl}?${params.toString()}`;

      console.log(`🔗 Payment Created (Using Internal Payment Page):`);
      console.log(`   ID: ${paymentId}`);
      console.log(`   Amount: ${paymentData.amount} ${paymentData.currency}`);
      console.log(`   Description: ${paymentData.description}`);
      console.log(`   Payment URL: ${paymentUrl}`);

      return {
        id: paymentId,
        url: paymentUrl,
        status: 'pending',
        amount: paymentData.amount,
        currency: paymentData.currency
      };
    } catch (error) {
      console.error('Error creating payment:', error);
      throw new Error('Failed to create payment');
    }
  }

  async getPaymentStatus(paymentId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching payment status:', error);
      throw new Error('Failed to fetch payment status');
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto');
    const webhookSecret = process.env.HELIO_WEBHOOK_SECRET || '';
    
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}

export const helioService = new HelioPaymentService();
