import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getProfile } from '@/lib/queries'
import { isFresh } from '@/lib/setup'
import { imageUrl, focalPosition, IMG } from '@/lib/media'
import LoginForm from '@/components/LoginForm'
import { lockSeconds } from './actions'

export const metadata = { title: 'เข้าสู่ระบบครู' }
export const dynamic = 'force-dynamic'

/** เข้าสู่ระบบครู — แปลงจาก login.php (บัญชีเดียว ไม่มีสมัครสมาชิก) */
export default async function LoginPage({
  searchParams,
}: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  if (await isFresh()) redirect('/setup')      // ยังไม่มีบัญชี = ยังไม่ได้ติดตั้ง
  if (await getSession()) redirect(next?.startsWith('/admin') ? next : '/admin')

  const [profile, locked] = await Promise.all([getProfile(), lockSeconds()])
  const avatar = { source: profile?.avatar_source ?? null, ref: profile?.avatar_ref ?? null }

  return (
    <main className="min-h-screen mesh grid place-items-center p-5 md:p-10 overflow-hidden relative">
      <div className="blob blob-1 w-[420px] h-[420px] -right-24 -top-24" />
      <div className="blob blob-2 w-[320px] h-[320px] -left-20 bottom-0" />
      <div className="blob blob-3 w-[220px] h-[220px] left-[45%] -bottom-20 hidden md:block" />

      <div className="relative w-full max-w-[960px] grid lg:grid-cols-[1fr_1.05fr] rounded-[2.4rem] overflow-hidden shadow-lift bg-white">

        {/* ฝั่งโปรไฟล์ */}
        <section className="relative grad-hero text-white p-8 md:p-10 flex flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 dots opacity-25" />
          <div className="relative">
            <Link href="/" className="chip chip-glass !text-ink">← กลับหน้าเว็บ</Link>
          </div>
          <div className="relative mt-8 lg:mt-0">
            <div className="ring-grad !bg-white/40 w-[136px] h-[136px] mx-auto lg:mx-0">
              <div className="w-full h-full rounded-full overflow-hidden bg-white">
                {avatar.ref ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={imageUrl(avatar, IMG.avatar)} alt={`รูปครู${profile?.nickname ?? ''}`}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: focalPosition(profile?.avatar_focus_x ?? 50, profile?.avatar_focus_y ?? 35) }} />
                ) : (
                  <span className="w-full h-full grid place-items-center text-5xl">👩‍🏫</span>
                )}
              </div>
            </div>
            <h2 className="mt-5 text-[24px] md:text-[28px] font-bold leading-tight text-center lg:text-left">
              {profile?.full_name}
            </h2>
            <p className="mt-1 text-[13.5px] text-white/85 text-center lg:text-left">
              {profile?.position} วิทยฐานะ{profile?.academic_standing}
            </p>
            {profile?.motto && (
              <p className="mt-5 italic text-[14px] bg-white/18 backdrop-blur rounded-2xl px-5 py-3 border border-white/30">
                “{profile.motto}”
              </p>
            )}
          </div>
          <p className="relative mt-8 text-[11px] text-white/70">e-Portfolio · ตามหลักเกณฑ์ วPA (ว9/2564)</p>
        </section>

        {/* ฟอร์ม */}
        <section className="p-7 md:p-12 flex flex-col justify-center">
          <span className="chip chip-primary w-fit">🔐 สำหรับครูเจ้าของแฟ้มเท่านั้น</span>
          <h1 className="mt-4 text-[28px] md:text-[34px] font-bold leading-tight">
            ยินดีต้อนรับ<span className="grad-text">กลับมา</span> 👋
          </h1>
          <p className="mt-1.5 text-[13.5px] text-ink-muted">เข้าสู่ระบบเพื่อจัดการแฟ้มสะสมผลงานของคุณ</p>

          {locked > 0 && (
            <div className="mt-5 rounded-2xl bg-coral-soft border-2 border-coral/40 text-coral-deep text-[13px] px-4 py-3 font-medium">
              ⚠️ พยายามเข้าสู่ระบบผิดหลายครั้ง กรุณารออีก {Math.ceil(locked / 60)} นาที
            </div>
          )}

          <LoginForm next={next ?? ''} locked={locked} />

          <p className="mt-6 text-[11.5px] text-ink-faint text-center leading-relaxed">
            ป้องกันด้วย BCRYPT · คุกกี้ HttpOnly + SameSite · จำกัดการพยายามเข้าสู่ระบบ 5 ครั้ง/15 นาที
          </p>
        </section>
      </div>
    </main>
  )
}
