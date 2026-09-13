'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { activeMenu, type MenuKey } from '@/lib/theme'

/** เมนูล่างสำหรับมือถือ — ยกมาจาก partials/footer.php ของเว็บ PHP (ซ่อนอัตโนมัติบนจอ ≥768px) */
const ITEMS: { key: MenuKey; href: string; icon: string; label: string }[] = [
  { key: 'home', href: '/', icon: '🏠', label: 'หน้าแรก' },
  { key: 'pa', href: '/pa', icon: '📋', label: 'PA' },
  { key: 'develop', href: '/development', icon: '🌱', label: 'พัฒนาตนเอง' },
  { key: 'about', href: '/about', icon: '👤', label: 'ประวัติ' },
]

export default function BottomNav() {
  const path = usePathname()
  const cur = activeMenu(path)

  return (
    <nav className="bottom-nav no-print" aria-label="เมนูหลัก">
      {ITEMS.map((i) => (
        <Link key={i.href} href={i.href} className={cur === i.key ? 'active' : ''}>
          <span className="ic">{i.icon}</span><span className="lb">{i.label}</span>
        </Link>
      ))}
    </nav>
  )
}
