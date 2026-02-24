// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/query1\.finance\.yahoo\.com\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'market-data-cache',
        expiration: { maxEntries: 200, maxAgeSeconds: 300 }, // 5 min
      },
    },
    {
      urlPattern: /^https:\/\/api\.exchangerate-api\.com\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'fx-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 3600 }, // 1 hr
      },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Required for Docker deployment
}

module.exports = withPWA(nextConfig)
