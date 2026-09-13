import type { NextConfig } from 'next'

const config: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'lh3.googleusercontent.com' }],
  },
  env: { NEXT_PUBLIC_ON_NETLIFY: process.env.NETLIFY ?? '' },

  // ปิด optimizer ในตัวของ Next เพราะบน Netlify ใช้ Image CDN ของ Netlify
  // และรูปจาก Drive ย่อขนาดมาแล้วด้วยพารามิเตอร์ =w
  experimental: { optimizePackageImports: [] },
}
export default config
