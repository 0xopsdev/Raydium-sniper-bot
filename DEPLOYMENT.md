# 🚀 Deployment Guide - Crypto Lottery Discord Bot

## 📋 Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Update `config.env` with your actual credentials
- [ ] Test database connection: `npm run test-setup`
- [ ] Register Discord commands: `npm run register-commands`

### 2. Required Credentials
- [ ] Discord Bot Token
- [ ] Discord Client ID & Public Key
- [ ] MongoDB Connection String
- [ ] Helio API Key & Webhook Secret

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set Environment Variables**
   ```bash
   vercel env add DISCORD_BOT_TOKEN
   vercel env add DISCORD_CLIENT_ID
   vercel env add DISCORD_PUBLIC_KEY
   vercel env add MONGODB_URI
   vercel env add HELIO_API_KEY
   vercel env add HELIO_WEBHOOK_SECRET
   ```

4. **Redeploy with Environment Variables**
   ```bash
   vercel --prod
   ```

### Option 2: Railway

1. **Connect GitHub Repository**
2. **Set Environment Variables in Railway Dashboard**
3. **Deploy Automatically**

### Option 3: DigitalOcean App Platform

1. **Create New App**
2. **Connect GitHub Repository**
3. **Set Environment Variables**
4. **Deploy**

## 🤖 Discord Bot Deployment

### 1. Register Commands
```bash
npm run register-commands
```

### 2. Start Bot Process
```bash
# Development
npm run dev:bot

# Production
npm run bot
```

### 3. Keep Bot Running
Use PM2 for production:
```bash
npm install -g pm2
pm2 start src/bot/index.ts --name "crypto-lottery-bot" --interpreter tsx
pm2 save
pm2 startup
```

## 🔗 Webhook Configuration

### Helio Webhook Setup
1. **Webhook URL**: `https://your-domain.com/api/webhooks/helio`
2. **Events**: Payment completed, Payment failed
3. **Secret**: Use your `HELIO_WEBHOOK_SECRET`

### Discord Bot Permissions
Required permissions:
- Send Messages
- Use Slash Commands
- Embed Links
- Attach Files
- Read Message History

## 📊 Database Setup

### MongoDB Atlas
1. Create cluster
2. Set up database user
3. Whitelist IP addresses
4. Get connection string

### Local MongoDB
```bash
# Install MongoDB
brew install mongodb/brew/mongodb-community

# Start service
brew services start mongodb/brew/mongodb-community

# Connection string
MONGODB_URI=mongodb://localhost:27017/crypto-lottery
```

## 🔧 Production Configuration

### Environment Variables
```env
NODE_ENV=production
DISCORD_BOT_TOKEN=your_production_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_PUBLIC_KEY=your_public_key
MONGODB_URI=your_production_mongodb_uri
HELIO_API_KEY=your_helio_api_key
HELIO_WEBHOOK_SECRET=your_webhook_secret
API_BASE_URL=https://your-domain.com/api
```

### Security Considerations
- [ ] Use HTTPS in production
- [ ] Validate webhook signatures
- [ ] Rate limit API endpoints
- [ ] Monitor bot activity
- [ ] Regular database backups

## 🧪 Testing Deployment

### 1. Test API Endpoints
```bash
# Test wallet endpoint
curl "https://your-domain.com/api/user/wallet?discord_id=123456789"

# Test tickets endpoint
curl "https://your-domain.com/api/tickets?discord_id=123456789"
```

### 2. Test Discord Bot
- [ ] Bot responds to `/buy-tickets`
- [ ] Bot responds to `/link-wallet`
- [ ] Bot responds to `/my-tickets`
- [ ] Bot responds to `/quickpick`

### 3. Test Payment Flow
- [ ] Payment link generates correctly
- [ ] Webhook receives payment confirmation
- [ ] Tickets sync to database
- [ ] Ticket images generate

## 📈 Monitoring

### Bot Health Checks
```bash
# Check bot status
pm2 status

# View logs
pm2 logs crypto-lottery-bot

# Restart if needed
pm2 restart crypto-lottery-bot
```

### Database Monitoring
- Monitor connection count
- Check query performance
- Set up alerts for errors

## 🆘 Troubleshooting

### Common Issues

1. **Bot Not Responding**
   - Check bot token
   - Verify bot permissions
   - Check server logs

2. **Database Connection Failed**
   - Verify MongoDB URI
   - Check network connectivity
   - Verify database credentials

3. **Payment Webhooks Not Working**
   - Check webhook URL
   - Verify signature validation
   - Check Helio dashboard

4. **Commands Not Registered**
   - Run `npm run register-commands`
   - Check Discord Developer Portal
   - Verify bot permissions

### Support
- Check logs: `pm2 logs crypto-lottery-bot`
- Test setup: `npm run test-setup`
- Verify environment: `npm run test-setup`

## 🎉 Post-Deployment

1. **Invite Bot to Server**
   - Use the invite link from README
   - Grant necessary permissions

2. **Test Complete Flow**
   - Link wallet
   - Buy tickets
   - Verify database sync
   - Check ticket images

3. **Monitor Performance**
   - Set up logging
   - Monitor error rates
   - Track user engagement

---

**Your Crypto Lottery Discord Bot is now live! 🎟️**
