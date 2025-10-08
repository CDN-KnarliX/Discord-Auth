/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Environment variables available on the client side (if needed)
  env: {
    FRONTEND_URL: process.env.FRONTEND_URL,
  },
}

module.exports = nextConfig
