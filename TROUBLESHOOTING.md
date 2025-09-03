# 🔧 Troubleshooting Guide - Crypto Lottery Discord Bot

## ✅ **Current Status: WORKING!**

Your bot is now successfully running! Here's what we fixed:

### 🐛 **Issues Fixed:**

1. **❌ Missing Dependencies**: Removed non-existent `helio-pay` package
2. **❌ Canvas Installation Issues**: Removed `canvas` and `sharp` dependencies that require Python compilation
3. **❌ PowerShell Command Issues**: Used proper Windows PowerShell syntax
4. **✅ Dependencies Installed**: All required packages are now installed
5. **✅ Commands Registered**: Discord slash commands are registered
6. **✅ Bot Running**: Discord bot is running in background
7. **✅ API Server**: Next.js development server is running

## 🚀 **What's Working:**

- ✅ Discord bot is online and ready
- ✅ Slash commands are registered (`/buy-tickets`, `/link-wallet`, `/my-tickets`, `/quickpick`)
- ✅ Database connection is configured
- ✅ API endpoints are available
- ✅ Ticket generation (text-based for now)

## ⚠️ **What You Need to Do:**

### 1. **Update Helio API Credentials**
Edit your `config.env` file and replace:
```env
HELIO_API_KEY=your_helio_api_key_here
HELIO_WEBHOOK_SECRET=your_helio_webhook_secret_here
```

With your actual Helio credentials from [Helio Dashboard](https://helio.co)

### 2. **Test the Bot**
1. Go to your Discord server
2. Try the command: `/link-wallet address:your_wallet_address`
3. Try: `/buy-tickets number:1`

##  **Current Bot Commands:**

- `/buy-tickets [number]` - Purchase lottery tickets
- `/link-wallet [address]` - Link your crypto wallet  
- `/my-tickets` - View your recent tickets
- `/quickpick` - Generate random numbers

##  **API Endpoints Available:**

- `http://localhost:3000/api/user/wallet?discord_id=YOUR_ID`
- `http://localhost:3000/api/tickets?discord_id=YOUR_ID`
- `http://localhost:3000/api/lottery/tickets` (POST)
- `http://localhost:3000/api/webhooks/helio` (POST)

##  **Next Steps:**

1. **Get Helio API Keys**: Sign up at [Helio.co](https://helio.co) and get your API credentials
2. **Update config.env**: Add your real Helio credentials
3. **Test Payment Flow**: Try buying tickets with real USDC
4. **Deploy**: Use the deployment guide to go live

##  **If You Still Have Issues:**

### Bot Not Responding:
```bash
# Check if bot is running
npm run dev:bot
```

### Commands Not Working:
```bash
# Re-register commands
npm run register-commands
```

### Database Issues:
```bash
# Test database connection
npm run test-setup
```

### API Not Working:
```bash
# Start Next.js server
npm run dev
```

##  **Bot Invite Link:**
[Invite Bot to Your Server](https://discord.com/oauth2/authorize?client_id=1412476966363463762)

##  **Success!**

Your Crypto Lottery Discord Bot is now running successfully! The main functionality is working, and you just need to add your Helio payment credentials to enable crypto payments.

---

**Need help? Check the logs or run `npm run test-setup` to verify everything is working.**
