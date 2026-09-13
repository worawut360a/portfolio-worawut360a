import type { Metadata, Viewport } from 'next'
import { Sarabun } from 'next/font/google'
import './globals.css'
import { getProfile, getSetting } from '@/lib/queries'
import { isSiteTheme } from '@/lib/theme'

/**
 * การแคชหน้าเว็บ
 *
 * เดิมตั้ง force-dynamic ทำให้ทุกครั้งที่มีคนกดต้องสร้างหน้าใหม่หมด
 * และวิ่งไปถามฐานข้อมูลที่โตเกียวสิบกว่ารอบ → รอ 1–2 วินาทีต่อการกด 1 ครั้ง
 *
 * เปลี่ยนมาเก็บหน้าไว้ที่ CDN แทน ผู้ชมจึงได้หน้าทันทีโดยไม่ต้องรอเซิร์ฟเวอร์
 * ส่วนความสดของข้อมูลไม่เสีย เพราะทุก action ในหน้าหลังบ้านเรียก
 * revalidatePath('/', 'layout') อยู่แล้ว → พอครูกดบันทึก หน้าเว็บอัปเดตทันที
 *
 * ตัวเลขนี้เป็นแค่ตาข่ายกันพลาด เผื่อกรณีที่ข้อมูลถูกแก้จากนอกระบบ
 *
 * หมายเหตุ: หน้าหลังบ้าน /login /setup อ่าน cookie จึงเป็น dynamic เองอัตโนมัติ
 *          ไม่ถูกแคชแน่นอน
 */
export const revalidate = 3600

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sarabun',
  display: 'swap',
})

/** ไอคอนแท็บ ✨ แบบ SVG ฝังในตัว — ชุดเดียวกับ partials/head.php ของเว็บ PHP */
const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%E2%9C%A8%3C/text%3E%3C/svg%3E"

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile()
  const name = profile?.full_name ?? 'แฟ้มสะสมผลงานครู'
  return {
    title: { default: `แฟ้มสะสมผลงาน ${name}`, template: `%s · ${profile?.nickname || 'ครู'}` },
    description: `แฟ้มสะสมผลงานครู ตามเกณฑ์ วPA (ว9/2564) — ${name} ${profile?.school ?? ''}`.trim(),
    icons: { icon: FAVICON },
  }
}

/** สีแถบเบราว์เซอร์บนมือถือ เปลี่ยนตามธีมเหมือนเว็บ PHP */
const THEME_COLOR: Record<string, string> = {
  emerald: '#0B6E4F', royal: '#1D4ED8', maroon: '#8C1D3F',
}

export async function generateViewport(): Promise<Viewport> {
  const theme = await getSetting('theme')
  return {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',      // เผื่อรอยบากของ iPhone
    themeColor: THEME_COLOR[isSiteTheme(theme) ? theme : 'royal'],
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await getSetting('theme')
  return (
    <html lang="th" data-theme={isSiteTheme(theme) ? theme : 'royal'} className={sarabun.variable}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
