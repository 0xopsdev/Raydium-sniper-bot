# 🔑 How to Get Helio API Credentials

## 🎯 **What You Need:**

To enable crypto payments in your Discord bot, you need to get API credentials from Helio. Here's how:

## 📋 **Step-by-Step Guide:**

### 1. **Sign Up for Helio**
1. Go to [https://helio.co](https://helio.co)
2. Click "Sign Up" or "Get Started"
3. Create an account with your email
4. Verify your email address

### 2. **Create a Project**
1. Log into your Helio dashboard
2. Click "Create Project" or "New Project"
3. Fill in your project details:
    - **Project Name**: "Crypto Lottery Discord Bot"
    - **Description**: "Discord bot for lottery ticket purchases"
    - **Website**: Your website URL (optional)

### 3. **Get API Credentials**
1. In your project dashboard, go to "Settings" or "API Keys"
2. You'll find:
   - **API Key**: Copy this (starts with `helio_` or similar)
   - **Webhook Secret**: Copy this (used for webhook verification)

### 4. **Update Your Config**
Edit your `config.env` file and replace:
```env
HELIO_API_KEY=your_helio_api_key_here
HELIO_WEBHOOK_SECRET=your_helio_webhook_secret_here
```

With your actual credentials:
```env
HELIO_API_KEY=helio_1234567890abcdef
HELIO_WEBHOOK_SECRET=whsec_1234567890abcdef
```

### 5. **Set Up Webhook**
1. In Helio dashboard, go to "Webhooks"
2. Add a new webhook:
   - **URL**: `https://your-domain.com/api/webhooks/helio`
   - **Events**: Select "Payment Completed" and "Payment Failed"
   - **Secret**: Use the same webhook secret from step 3

## 🔧 **Alternative: Use Test Mode**

If you want to test without real payments:

### 1. **Enable Test Mode**
- In Helio dashboard, toggle "Test Mode" or "Sandbox Mode"
- This allows you to test with fake payments

### 2. **Use Test Credentials**
- Helio will provide test API keys
- Use these for development and testing

## 🚀 **Quick Start (Without Helio)**

If you want to test the bot without setting up Helio right now:

### 1. **Mock Payment System**
I can create a simple mock payment system for testing. Let me know if you want this!

### 2. **Test Other Features**
You can still test:
- ✅ Wallet linking (`/link-wallet`)
- ✅ Ticket viewing (`/my-tickets`)
- ✅ Number generation (`/quickpick`)
- ✅ Database operations
- ✅ API endpoints

## 🆘 **Common Issues:**

### "Invalid API Key"
- Make sure you copied the full API key
- Check for extra spaces or characters
- Verify the key is from the correct project

### "Webhook Not Working"
- Make sure your webhook URL is accessible
- Check that the webhook secret matches
- Verify the webhook events are selected

### "Payment Not Processing"
- Check if you're in test mode vs live mode
- Verify your project is approved (if required)
- Check the Helio dashboard for error logs

## 📞 **Need Help?**

1. **Helio Documentation**: [https://docs.helio.co](https://docs.helio.co)
2. **Helio Support**: Contact them through their dashboard
3. **Discord Community**: Join Helio's Discord for help

##  **Once You Have Credentials:**

1. Update your `config.env` file
2. Restart the bot: `npm run dev:bot`
3. Test with `/buy-tickets number:1`
4. The bot will generate a payment link!

---

**Your bot is ready to go! Just add the Helio credentials and you'll have a fully functional crypto lottery bot! 🎟️**
