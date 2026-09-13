import Link from 'next/link'
import type { Profile } from '@/lib/types'
import { currentAcademicYear } from '@/lib/theme'

export default function Footer({ profile }: { profile: Profile | null }) {
  const fb = (profile?.facebook ?? '').trim()
  const fbUrl = fb && !/^https?:\/\//i.test(fb) && !/\s/.test(fb)
    ? `https://facebook.com/${fb.replace(/^[/@]+/, '')}`
    : fb

  return (
    <footer className="footer-bar rainbow-top mt-16 no-print">
      <div className="absolute inset-0 dots opacity-20 pointer-events-none" />
      <div className="relative max-w-[1240px] mx-auto px-4 md:px-10 py-5 md:py-6
                      flex flex-wrap items-center justify-center gap-x-6 gap-y-3.5 text-center">
        <Link href="/" className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-white/15 border border-white/25 grid place-items-center text-xl shrink-0">🎓</span>
          <span className="leading-tight text-left">
            <span className="block font-bold text-[15px]">แฟ้มผลงาน{profile?.nickname || 'ครู'}</span>
            <span className="block text-[11.5px] text-white/75">แฟ้มสะสมผลงานครู ตามเกณฑ์ วPA</span>
          </span>
        </Link>

        <span className="chip bg-white/15 border border-white/25 text-white !text-[12.5px] !py-1.5 !px-3.5">© {currentAcademicYear()}</span>

        <span className="text-[12.5px] text-white/80">
          {profile?.school}
          {fbUrl && (
            <>
              <span className="text-white/40 mx-1.5">|</span>
              <a href={fbUrl} target="_blank" rel="noopener noreferrer"
                 className="font-semibold text-white underline underline-offset-4 decoration-white/40">เพจของครู</a>
            </>
          )}
          <span className="text-white/40 mx-1.5">|</span>
          <Link href="/contact" className="font-semibold text-white underline underline-offset-4 decoration-white/40">ติดต่อ</Link>
        </span>
      </div>
    </footer>
  )
}
