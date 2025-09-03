# 🎟️ Crypto Lottery Discord Bot

A Discord bot that allows users to purchase lottery tickets using cryptocurrency, with seamless integration to a web platform.

## 🚀 Features

- **Crypto Payments**: Accept USDC payments via Helio payment gateway
- **Interactive Ticket Selection**: Choose numbers manually or use QuickPick
- **Real-time Sync**: Tickets sync to your website database
- **Social Sharing**: Auto-generated ticket images for social media
- **Wallet Integration**: Link Discord accounts to crypto wallets

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Bot Framework**: Discord.js v14
- **Database**: MongoDB with Mongoose
- **Payments**: Helio (Solana/USDC)
- **Image Generation**: Canvas + Sharp
- **Deployment**: Vercel/Netlify ready

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB database
- Discord Bot Token
- Helio API credentials

## ⚙️ Setup

1. **Clone and Install**
   ```bash
   git clone <repository>
   cd crypto-lottery-discord-bot
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp config.env .env.local
   ```
   
   Update `.env.local` with your credentials:
   ```env
   DISCORD_BOT_TOKEN=your_bot_token
   DISCORD_CLIENT_ID=your_client_id
   DISCORD_PUBLIC_KEY=your_public_key
   MONGODB_URI=your_mongodb_connection
   HELIO_API_KEY=your_helio_api_key
   HELIO_WEBHOOK_SECRET=your_webhook_secret
   ```

3. **Register Discord Commands**
   ```bash
   npm run register-commands
   ```

4. **Start Development**
   ```bash
   # Start Next.js app
   npm run dev
   
   # Start Discord bot (in separate terminal)
   npm run dev:bot
   ```

## 🎮 Bot Commands

- `/buy-tickets [number]` - Purchase lottery tickets
- `/link-wallet [address]` - Link your crypto wallet
- `/my-tickets` - View your recent tickets
- `/quickpick` - Generate random numbers

## 🔄 User Flow

1. **Link Wallet**: User links Discord to crypto wallet
2. **Buy Tickets**: User purchases tickets with USDC
3. **Select Numbers**: Choose 5 numbers (1-69) + Powerball (1-25)
4. **Auto-Sync**: Tickets sync to website database
5. **Social Share**: Receive generated ticket image

## 🏗️ API Endpoints

- `POST /api/lottery/tickets` - Create new tickets
- `GET /api/user/wallet` - Get user wallet info
- `GET /api/tickets` - Fetch user tickets
- `POST /api/webhooks/helio` - Payment webhook

## 🎨 Ticket Image Generation

The bot automatically generates branded ticket images with:
- User's selected numbers
- Powerball number
- Ticket ID and draw date
- Jackpot amount
- QR code linking to website
- Social sharing prompts

## 🔐 Security Features

- Webhook signature verification
- Wallet-Discord ID validation
- Number range validation
- Rate limiting on commands
- Secure payment processing

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy
```

### Manual Server
```bash
npm run build
npm start
```

## 📱 Discord Bot Invite

[Invite Bot to Server](https://discord.com/oauth2/authorize?client_id=1412476966363463762)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support, join our Discord server or create an issue on GitHub.

---

**Built with ❤️ for the crypto community**
