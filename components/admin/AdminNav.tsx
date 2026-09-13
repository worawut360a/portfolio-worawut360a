'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { imageUrl, focalPosition, IMG } from '@/lib/media'
import { initialOf } from '@/lib/theme'
import type { Profile } from '@/lib/types'

/**
 * Sidebar หลังบ้าน — แปลงจาก admin/_layout.php ของเว็บ PHP
 * เมนูชุดเดียวกัน ใช้คลาส .sidebar-link เดิม และเปิด/ปิดได้บนจอมือถือ
 */
const NAV: [string, string, string][] = [
  ['🏠', 'แดชบอร์ด', '/admin'],
  ['📋', 'ข้อตกลง PA · ผลงาน', '/admin/pa'],
  ['👩‍🏫', 'โปรไฟล์ครู', '/admin/profile'],
  ['🌱', 'การพัฒนาตนเอง', '/admin/self-dev'],
  ['🏅', 'รางวัล', '/admin/awards'],
]

export default function AdminNav({ profile, logout }: { profile: Profile | null; logout: () => Promise<void> }) {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const on = (href: string) => (href === '/admin' ? path === '/admin' : path.startsWith(href))
  const initial = initialOf(profile?.full_name ?? '')
  const avatar = profile?.avatar_ref
    ? imageUrl({ source: profile.avatar_source, ref: profile.avatar_ref }, IMG.thumb)
    : null
  const focal = focalPosition(profile?.avatar_focus_x, profile?.avatar_focus_y)

  useEffect(() => { setOpen(false) }, [path])

  return (
    <>
      {/* ปุ่มเปิดเมนูบนจอมือถือ — วางไว้ใน header ผ่าน portal ไม่ได้ จึงวางลอยไว้มุมบนซ้าย */}
      <button onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-4 z-[46] w-10 h-10 rounded-lg bg-primary text-white grid place-items-center shrink-0"
        aria-label="เปิดเมนู">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
      </button>

      <aside className={`fixed lg:sticky lg:top-[76px] lg:self-start lg:h-[calc(100vh-92px)] inset-y-0 left-0 z-50 w-[262px] shrink-0
                         bg-white lg:rounded-[2rem] border border-[color:var(--border)] shadow-soft
                         px-3.5 py-4 flex flex-col gap-1 overflow-y-auto transition-transform duration-300 ease-out
                         ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* โปรไฟล์ */}
        <div className="relative overflow-hidden rounded-[1.5rem] grad-hero text-white px-4 py-4 mb-3">
          <div className="absolute inset-0 dots opacity-25" />
          <div className="relative flex items-center gap-3">
            {avatar ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={avatar} alt="" style={{ objectPosition: focal }}
                className="w-12 h-12 rounded-full object-cover border-2 border-white/80 shadow" />
            ) : (
              <span className="w-12 h-12 rounded-full grid place-items-center text-white font-bold text-lg bg-white/25 border-2 border-white/80">{initial}</span>
            )}
            <span className="leading-tight min-w-0">
              <span className="block font-bold text-[14px] truncate">{profile?.nickname || profile?.full_name}</span>
              <span className="block text-[10.5px] text-white/85 font-medium">ระบบหลังบ้าน · Admin</span>
            </span>
            <button onClick={() => setOpen(false)}
              className="lg:hidden ml-auto w-9 h-9 rounded-full bg-white/25 grid place-items-center" aria-label="ปิดเมนู">✕</button>
          </div>
        </div>

        <p className="px-3 pb-1 text-[10.5px] font-semibold tracking-[.16em] uppercase text-ink-faint">เมนูจัดการ</p>
        {NAV.map(([icon, label, href]) => (
          <Link key={href} href={href} className={`sidebar-link${on(href) ? ' active' : ''}`}>
            <span className="ico">{icon}</span>{label}
          </Link>
        ))}

        <div className="mt-auto pt-3 border-t border-[color:var(--divider)] flex flex-col gap-1">
          <Link href="/admin/settings" className={`sidebar-link${on('/admin/settings') ? ' active' : ''}`}>
            <span className="ico">⚙️</span>ตั้งค่า
          </Link>
          <a href="/" target="_blank" rel="noopener noreferrer" className="sidebar-link">
            <span className="ico">👁️</span>ดูหน้าเว็บ
          </a>
          <form action={logout}>
            <button type="submit" className="sidebar-link w-full !text-[color:var(--danger)]">
              <span className="ico">🚪</span>ออกจากระบบ
            </button>
          </form>
        </div>
      </aside>

      {open && (
        <div onClick={() => setOpen(false)}
          className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-40 lg:hidden" />
      )}
    </>
  )
}
