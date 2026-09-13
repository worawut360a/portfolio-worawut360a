'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Profile } from '@/lib/types'
import { imageUrl, focalPosition, IMG } from '@/lib/media'
import { initialOf, activeMenu, type MenuKey } from '@/lib/theme'

/** เมนูหลัก — ลำดับและชื่อตรงกับ partials/nav.php ของเว็บ PHP */
const MENU: { key: MenuKey; href: string; label: string }[] = [
  { key: 'home', href: '/', label: 'หน้าแรก' },
  { key: 'pa', href: '/pa', label: 'ข้อตกลง PA' },
  { key: 'develop', href: '/development', label: 'การพัฒนาตนเอง' },
  { key: 'about', href: '/about', label: 'ประวัติครู' },
  { key: 'contact', href: '/contact', label: 'ติดต่อ' },
]

export default function Header({ profile }: { profile: Profile | null }) {
  const path = usePathname()
  const [open, setOpen] = useState(false)

  /**
   * เช็คสถานะล็อกอินฝั่งเบราว์เซอร์ ไม่ใช่ฝั่งเซิร์ฟเวอร์
   *
   * ถ้า layout อ่าน cookie เอง หน้าสาธารณะทุกหน้าจะกลายเป็น dynamic
   * เสียการแคชที่ CDN ทั้งเว็บ และพังตอนรันจริงด้วย (DYNAMIC_SERVER_USAGE)
   * ปุ่มนี้เป็นแค่ทางลัด ไม่ใช่ด่านความปลอดภัย — /admin ตรวจสิทธิ์เองอยู่แล้ว
   */
  const [loggedIn, setLoggedIn] = useState(false)
  useEffect(() => {
    let alive = true
    fetch('/api/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => { if (alive) setLoggedIn(!!j.ok) })
      .catch(() => {})
    return () => { alive = false }
  }, [])
  const cur = activeMenu(path)

  const admin = loggedIn
    ? { label: 'หลังบ้าน', href: '/admin' }
    : { label: 'เข้าสู่ระบบ', href: '/login' }

  return (
    <header className="sticky top-0 z-40 pointer-events-none no-print">
      <div className="rainbow-edge pointer-events-auto bg-white/95 backdrop-blur shadow-sm">
        <div className="max-w-[1240px] mx-auto flex items-center justify-between gap-3 px-4 md:px-10 py-2.5">

          {/* โลโก้ */}
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <span className="ring-grad shrink-0">
              {profile?.avatar_ref ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={imageUrl({ source: profile.avatar_source, ref: profile.avatar_ref }, IMG.thumb)}
                  alt="" className="w-10 h-10 rounded-full object-cover"
                  style={{ objectPosition: focalPosition(profile.avatar_focus_x, profile.avatar_focus_y) }} />
              ) : (
                <span className="w-10 h-10 rounded-full grid place-items-center text-white font-bold text-lg grad-bg">
                  {initialOf(profile?.full_name)}
                </span>
              )}
            </span>
            <span className="block leading-tight min-w-0">
              <span className="block font-bold text-[13.5px] sm:text-[14.5px] text-ink truncate">
                แฟ้มผลงาน <span className="text-primary">{profile?.nickname || 'ครู'}</span>
              </span>
              <span className="block text-[10px] sm:text-[10.5px] text-ink-muted truncate">e-Portfolio · วPA ว9/2564</span>
            </span>
          </Link>

          {/* เมนู desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            {MENU.map((m) => (
              <Link key={m.href} href={m.href}
                className={`px-3.5 py-2 rounded-lg text-[13.5px] font-medium whitespace-nowrap transition-colors duration-200 ${
                  cur === m.key ? 'bg-primary text-white' : 'text-ink-soft hover:bg-primary-soft hover:text-primary'}`}>
                {m.label}
              </Link>
            ))}
          </nav>

          {/* ปุ่มขวา */}
          <div className="flex items-center gap-2">
            <Link href={admin.href} className="btn btn-ghost btn-sm hidden sm:inline-flex">{admin.label}</Link>
            <button type="button" aria-label="เปิดเมนู" aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="lg:hidden w-10 h-10 rounded-lg bg-primary text-white grid place-items-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
            </button>
          </div>
        </div>

        {/* เมนูมือถือ */}
        {open && (
          <nav className="lg:hidden border-t border-[color:var(--border)] bg-white px-3 py-2">
            {MENU.map((m) => (
              <Link key={m.href} href={m.href} onClick={() => setOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium min-h-[44px] ${
                  cur === m.key ? 'bg-primary text-white' : 'text-ink-soft hover:bg-primary-soft'}`}>
                {m.label}<span>→</span>
              </Link>
            ))}
            <Link href={admin.href} onClick={() => setOpen(false)}
              className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold text-primary sm:hidden">
              {admin.label}<span>→</span>
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
