import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Solana RPC endpoint (using devnet for testing)
const SOLANA_RPC_URL = 'https://api.devnet.solana.com';

export class SolanaWalletService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(SOLANA_RPC_URL, 'confirmed');
  }

  // Validate if a wallet address is valid
  isValidWalletAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get wallet balance
  async getWalletBalance(address: string): Promise<number> {
    try {
      const publicKey = new PublicKey(address);
      const balance = await this.connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL; // Convert lamports to SOL
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      throw new Error('Failed to get wallet balance');
    }
  }

  // Get wallet info
  async getWalletInfo(address: string): Promise<{
    address: string;
    balance: number;
    isValid: boolean;
  }> {
    const isValid = this.isValidWalletAddress(address);
    
    if (!isValid) {
      throw new Error('Invalid wallet address');
    }

    const balance = await this.getWalletBalance(address);

    return {
      address,
      balance,
      isValid
    };
  }

  // Check if user has enough SOL for payment
  async hasEnoughSOL(address: string, requiredAmount: number): Promise<boolean> {
    try {
      const balance = await this.getWalletBalance(address);
      return balance >= requiredAmount;
    } catch (error) {
      console.error('Error checking SOL balance:', error);
      return false;
    }
  }

  // Create a transfer transaction
  async createTransferTransaction(fromAddress: string, toAddress: string, amount: number): Promise<Transaction> {
    const fromPubkey = new PublicKey(fromAddress);
    const toPubkey = new PublicKey(toAddress);
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );

    return transaction;
  }

  // Get recent blockhash for transaction
  async getRecentBlockhash(): Promise<string> {
    try {
      const { blockhash } = await this.connection.getLatestBlockhash();
      return blockhash;
    } catch (error) {
      console.error('Error getting recent blockhash:', error);
      throw new Error('Failed to get recent blockhash');
    }
  }
}

export const solanaWalletService = new SolanaWalletService();
