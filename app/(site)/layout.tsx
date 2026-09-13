import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'
import { getProfile } from '@/lib/queries'
import { isFresh } from '@/lib/setup'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // ยังไม่ได้ติดตั้ง → พาไปหน้าติดตั้ง แทนที่จะให้ทุกหน้าพังเพราะยังไม่มีตาราง
  if (await isFresh()) redirect('/setup')
  const profile = await getProfile()
  return (
    // has-bottom-nav เว้นที่ว่างล่างสุดให้เมนูมือถือไม่ทับเนื้อหา (คลาสเดียวกับ <body> ของเว็บ PHP)
    <div className="has-bottom-nav">
      <Header profile={profile} />
      <main>{children}</main>
      <Footer profile={profile} />
      <BottomNav />
    </div>
  )
}
