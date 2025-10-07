# 🎰 **Crypto Lottery Discord Bot**

A fun and interactive **Discord bot** that lets users purchase lottery tickets using **cryptocurrency**, fully synced with a web platform — built for communities, traders, and degens alike. 🪄  



https://github.com/user-attachments/assets/11ca05a2-fd00-4f74-9e79-8330c69e42f2



---

## ✨ **Features**

- 💸 **Crypto Payments** – Accept **USDC** via **Helio** payment gateway (Solana)
- 🎟️ **Interactive Ticket Selection** – Choose numbers manually or use **QuickPick**
- 🔄 **Real-time Sync** – Instantly sync tickets to your web app database
- 📸 **Social Sharing** – Auto-generate branded ticket images ready for social media
- 🦊 **Wallet Integration** – Link Discord accounts to crypto wallets with ease  

---

## 🧠 **Tech Stack**

| Layer | Tech |
|-------|------|
| 🖥️ Frontend | Next.js 14 + TypeScript |
| 🤖 Bot Framework | Discord.js v14 |
| 🗄️ Database | MongoDB + Mongoose |
| 💰 Payments | Helio (USDC/Solana) |
| 🖼️ Image Generation | Canvas + Sharp |
| ☁️ Deployment | Vercel / Netlify Ready |

---

## ⚙️ **Prerequisites**

- Node.js 18+
- MongoDB instance
- Discord Bot Token
- Helio API Credentials  

---

## 🚀 **Setup**

### 1️⃣ Clone & Install
```bash
git clone <repository>
cd crypto-lottery-discord-bot
npm install
```

### 2️⃣ Configure Environment
```bash
cp config.env .env.local
```

Update `.env.local`:
```env
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_PUBLIC_KEY=your_public_key
MONGODB_URI=your_mongodb_connection
HELIO_API_KEY=your_helio_api_key
HELIO_WEBHOOK_SECRET=your_webhook_secret
```

### 3️⃣ Register Commands
```bash
npm run register-commands
```

### 4️⃣ Start Development
```bash
# Run Next.js frontend
npm run dev

# Run Discord bot (in separate terminal)
npm run dev:bot
```

---

## 💬 **Bot Commands**

| Command | Description |
|----------|--------------|
| `/buy-tickets [number]` | Purchase lottery tickets |
| `/link-wallet [address]` | Link your crypto wallet |
| `/my-tickets` | View your purchased tickets |
| `/quickpick` | Random number selection |

---

## 🔁 **User Flow**

1. 🦊 **Link Wallet** – Connect Discord → crypto wallet  
2. 🎟️ **Buy Tickets** – Pay in **USDC** via Helio  
3. 🔢 **Select Numbers** – Pick 5 numbers + Powerball  
4. 💾 **Auto Sync** – Tickets stored in web DB  
5. 📸 **Social Share** – Receive your ticket image  

---

## 🧩 **API Endpoints**

| Endpoint | Method | Description |
|-----------|--------|-------------|
| `/api/lottery/tickets` | POST | Create new tickets |
| `/api/user/wallet` | GET | Get user wallet info |
| `/api/tickets` | GET | Fetch user tickets |
| `/api/webhooks/helio` | POST | Handle payment webhook |

---

## 🖼️ **Ticket Image Generation**

Each ticket image includes:
- 🎯 User’s selected numbers  
- 🔴 Powerball number  
- 🆔 Ticket ID + draw date  
- 💰 Jackpot amount  
- 🔗 QR code linking to web app  
- 📢 Social sharing prompt  

---

## 🔐 **Security Features**

- ✅ Webhook signature verification  
- 🧍 Wallet ↔️ Discord ID validation  
- 🔢 Number range & input validation  
- 🕒 Command rate limiting  
- 💵 Secure payment processing  

---

## ☁️ **Deployment**

### 🧭 Deploy to Vercel (Recommended)
```bash
npm run build
vercel deploy
```

### ⚙️ Manual Server
```bash
npm run build
npm start
```

---

## 🤝 **Contributing**

1. Fork the repo 🍴  
2. Create a new branch 🌱  
3. Commit your changes 💾  
4. Push & open a PR 🚀  

---

## 🧾 **License**

Licensed under **MIT License** – see `LICENSE` for details.  

---

## 💬 **Support & Contact**

Need help or wanna collaborate?  
Join our Discord or reach out via Telegram 👇  

# 👨‍💻 Author
### 📞 Telegram: [0xOpsDev](https://t.me/its0xopsdev)   
https://t.me/its0xopsdev
---

🎰 *Bringing lottery fun to Discord — powered by crypto & community.* 💫
