import Link from 'next/link'
import { imageUrl, focalPosition, IMG } from '@/lib/media'
import { initialOf } from '@/lib/theme'
import type { Profile } from '@/lib/types'

/** แถบบนของหลังบ้าน — แปลงจาก admin/_layout.php (แถบขาว + เส้นรุ้งตัดขอบล่าง) */
export default function AdminHeader({ profile, logout }: { profile: Profile | null; logout: () => Promise<void> }) {
  const initial = initialOf(profile?.full_name ?? '')
  const avatar = profile?.avatar_ref
    ? imageUrl({ source: profile.avatar_source, ref: profile.avatar_ref }, IMG.thumb)
    : null

  return (
    <header className="rainbow-edge sticky top-0 z-[45] bg-white/95 backdrop-blur shadow-sm">
      <div className="px-4 md:px-6 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 pl-12 lg:pl-0">
          <Link href="/admin" className="flex items-center gap-2.5 min-w-0">
            <span className="ring-grad shrink-0">
              {avatar ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={avatar} alt="" className="w-10 h-10 rounded-full object-cover"
                  style={{ objectPosition: focalPosition(profile?.avatar_focus_x, profile?.avatar_focus_y) }} />
              ) : (
                <span className="w-10 h-10 rounded-full grid place-items-center text-white font-bold text-lg grad-bg">{initial}</span>
              )}
            </span>
            <span className="hidden sm:block leading-tight min-w-0">
              <span className="block font-bold text-[14.5px] text-ink truncate">
                ระบบหลังบ้าน <span className="text-primary">{profile?.nickname || 'ครู'}</span>
              </span>
              <span className="block text-[10.5px] text-ink-muted">e-Portfolio · วPA ว9/2564</span>
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
            👁️ <span className="hidden sm:inline">ดูหน้าเว็บ</span>
          </a>
          <form action={logout}>
            <button type="submit" className="btn btn-ghost btn-sm !border-[color:var(--danger)] !text-[color:var(--danger)]">
              🚪 <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
