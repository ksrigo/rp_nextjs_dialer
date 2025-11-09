/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    API_URL: process.env.API_URL,
    COOKIE_URL: process.env.COOKIE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
    images: {
      domains: ['localhost'],
      unoptimized: true,
    },
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
        }
      }
      return config
    },
  }
  
  export default nextConfig