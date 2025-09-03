/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_PUBLIC_KEY: process.env.DISCORD_PUBLIC_KEY,
    MONGODB_URI: process.env.MONGODB_URI,
    HELIO_API_KEY: process.env.HELIO_API_KEY,
    HELIO_WEBHOOK_SECRET: process.env.HELIO_WEBHOOK_SECRET,
  },
}

module.exports = nextConfig
