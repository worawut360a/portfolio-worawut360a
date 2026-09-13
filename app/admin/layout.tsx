import { redirect } from 'next/navigation'
import { requireAdmin, logout } from '@/lib/auth'
import { getProfile } from '@/lib/queries'
import AdminHeader from '@/components/admin/AdminHeader'
import AdminNav from '@/components/admin/AdminNav'

/**
 * เลย์เอาต์หลังบ้าน — แปลงจาก admin/_layout.php + admin/_foot.php ของเว็บ PHP
 * header แถบขาวมีเส้นรุ้ง · sidebar การ์ดขาวมีการ์ดโปรไฟล์ไล่สี · footer แบบเดียวกับหน้าเว็บ
 */
export const dynamic = 'force-dynamic'
export const metadata = { title: 'ระบบหลังบ้าน', robots: { index: false, follow: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  const profile = await getProfile()

  async function doLogout() {
    'use server'
    await logout()
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-admin)' }}>
      <AdminHeader profile={profile} logout={doLogout} />

      <div className="flex min-h-[calc(100vh-160px)] lg:p-3 lg:gap-3">
        <AdminNav profile={profile} logout={doLogout} />
        <main className="flex-1 min-w-0 px-4 md:px-6 py-4 md:py-5 lg:px-2">{children}</main>
      </div>

      {/* Footer แบบเดียวกับหน้าเว็บ */}
      <footer className="footer-bar rainbow-top mt-3 no-print">
        <div className="absolute inset-0 dots opacity-20 pointer-events-none" />
        <div className="relative max-w-[1240px] mx-auto px-4 md:px-10 py-5 md:py-6
                        flex flex-wrap items-center justify-center gap-x-6 gap-y-3.5 text-center">
          <span className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-white/15 border border-white/25 grid place-items-center text-xl shrink-0">🎓</span>
            <span className="leading-tight text-left">
              <span className="block font-bold text-[15px]">ระบบหลังบ้าน · แฟ้มผลงาน{profile?.nickname || 'ครู'}</span>
              <span className="block text-[11.5px] text-white/75">จัดการข้อมูลแฟ้มสะสมผลงาน ตามเกณฑ์ วPA</span>
            </span>
          </span>
        </div>
      </footer>
    </div>
  )
}
