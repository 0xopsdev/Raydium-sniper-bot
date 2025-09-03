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
    this.baseUrl = 'https://api.helio.co/v1';
  }

  async createPayment(paymentData: HelioPaymentRequest): Promise<HelioPaymentResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/payments`,
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating Helio payment:', error);
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
