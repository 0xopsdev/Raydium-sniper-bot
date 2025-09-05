# Vercel Deployment Guide for Crypto Lottery Discord Bot

## 🚀 Deployment Steps

### 1. Deploy Web Interface to Vercel

The web interface (Next.js app) can be deployed to Vercel, but the Discord bot needs to run on a separate server.

#### Option A: Deploy Web Interface Only
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy the project
vercel

# Set environment variables in Vercel dashboard
vercel env add DISCORD_TOKEN
vercel env add MONGODB_URI
vercel env add WEB_BASE_URL
vercel env add HELIO_API_KEY
vercel env add HELIO_WEBHOOK_SECRET
```

#### Option B: Deploy with Git Integration
1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

### 2. Deploy Discord Bot Separately

The Discord bot needs to run continuously, which Vercel doesn't support well. Use one of these options:

#### Option A: Railway (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy bot
railway up

# Set environment variables
railway variables set DISCORD_TOKEN=your_token
railway variables set MONGODB_URI=your_mongodb_uri
railway variables set WEB_BASE_URL=https://discord-bot-vert-zeta.vercel.app
```

#### Option B: Heroku
```bash
# Install Heroku CLI
# Create Procfile
echo "web: tsx src/bot/index.ts" > Procfile

# Deploy to Heroku
git add .
git commit -m "Deploy bot to Heroku"
git push heroku main
```

#### Option C: VPS (DigitalOcean, AWS, etc.)
```bash
# On your VPS
git clone your-repo
cd your-repo
npm install
npm run bot
```

### 3. Environment Variables

Set these in your deployment platform:

```env
DISCORD_TOKEN=your_discord_bot_token
MONGODB_URI=your_mongodb_connection_string
WEB_BASE_URL=https://discord-bot-vert-zeta.vercel.app
HELIO_API_KEY=your_helio_api_key
HELIO_WEBHOOK_SECRET=your_helio_webhook_secret
NODE_ENV=production
```

### 4. Current Setup

- **Web Interface**: Deploy to Vercel (https://discord-bot-vert-zeta.vercel.app)
- **Discord Bot**: Deploy to Railway/Heroku/VPS
- **Database**: MongoDB Atlas
- **Payment**: Helio integration

### 5. Testing

1. Deploy web interface to Vercel
2. Deploy bot to Railway/Heroku
3. Test Discord commands
4. Test web interface
5. Test payment flow

## 🔧 Troubleshooting

### Common Issues:
1. **Bot not responding**: Check if bot is running on separate server
2. **Web interface not loading**: Check Vercel deployment logs
3. **Database connection**: Verify MongoDB URI and network access
4. **Payment issues**: Check Helio configuration

### Logs:
- Vercel: Check function logs in Vercel dashboard
- Railway: `railway logs`
- Heroku: `heroku logs --tail`
