import Link from 'next/link'
import { getProfile } from '@/lib/queries'
import { imageUrl, IMG } from '@/lib/media'

export const metadata = { title: 'ติดต่อ' }

/**
 * หน้าติดต่อครู — แปลงมาจาก contact.php ของเว็บ PHP ให้โครงสร้างและข้อความตรงกัน
 *   HERO → การ์ดช่องทางติดต่อ 4 ช่อง → สถานที่ปฏิบัติงาน → แบนเนอร์ CTA
 */
export default async function ContactPage() {
  const profile = await getProfile()

  /* สร้างลิงก์ Facebook / Line จากค่าที่กรอกไว้ (ถ้าเป็น URL ใช้ตรง ๆ ถ้าเป็นชื่อ/ไอดี ประกอบเป็นลิงก์) */
  const linkFrom = (raw: string | undefined, prefix: string): string | null => {
    const v = (raw ?? '').trim()
    if (!v) return null
    if (/^https?:\/\//i.test(v)) return v
    if (/\s/u.test(v)) return null
    return prefix + v.replace(/^[@/]+/, '')
  }
  const fbHref = linkFrom(profile?.facebook, 'https://www.facebook.com/')
  const lineHref = linkFrom(profile?.line_id, 'https://line.me/ti/p/~')

  /* [ไอคอน, ป้าย, ค่าที่แสดง, href, gradient ของช่องไอคอน, คำอธิบายสั้น] */
  const cards: [string, string, string, string | null, string, string][] = []
  if (profile?.email) cards.push(['✉️', 'อีเมล', profile.email, `mailto:${profile.email}`, 'from-coral to-[#2F6FDB]', 'ส่งอีเมลถึงครู'])
  if (profile?.phone) cards.push(['☎️', 'โทรศัพท์', profile.phone, `tel:${profile.phone.replace(/\D/g, '')}`, 'from-mint to-[#E0457B]', 'แตะเพื่อโทร'])
  if (profile?.facebook) cards.push(['📘', 'Facebook', profile.facebook, fbHref, 'from-sky to-[#1D4ED8]', 'เปิดเพจ Facebook'])
  if (profile?.line_id) cards.push(['💬', 'Line ID', profile.line_id, lineHref, 'from-sunny to-[#F5C518]', 'เพิ่มเพื่อนใน Line'])

  return (
    <main>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden mesh">
        <div className="blob blob-1 w-[320px] h-[320px] -right-20 -top-10" />
        <div className="blob blob-2 w-[220px] h-[220px] -left-16 bottom-0 hidden md:block" />

        <div className="relative max-w-[1240px] mx-auto px-4 md:px-10 pt-10 md:pt-14 pb-10 text-center">
          <div className="flex justify-center">
            <div className="ring-grad w-[104px] h-[104px] md:w-[124px] md:h-[124px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl({ source: profile?.avatar_source ?? null, ref: profile?.avatar_ref ?? null }, IMG.avatar)}
                alt={`รูปครู${profile?.nickname ?? ''}`}
                className="w-full h-full rounded-full object-cover object-top bg-white" />
            </div>
          </div>

          <div>
            <span className="chip chip-glass mt-6">✉️ ช่องทางติดต่อ</span>
            <h1 className="mt-3 text-[34px] md:text-[52px] font-extrabold leading-[1.08] tracking-tight">
              ติดต่อ<span className="grad-text">ครู{profile?.nickname}</span>
            </h1>
            <p className="mt-3 text-[14px] md:text-[15.5px] text-ink-soft font-medium max-w-[560px] mx-auto">
              ยินดีแลกเปลี่ยนเรียนรู้ทางวิชาชีพ และให้คำปรึกษาเรื่องสื่อการสอนดิจิทัล
            </p>
            <p className="mt-1.5 text-[13px] text-ink-muted">
              {profile?.position} วิทยฐานะ{profile?.academic_standing}
              {profile?.subject_group ? ` · กลุ่มสาระ${profile.subject_group}` : ''}
            </p>
          </div>
        </div>
      </section>

      {/* ================= การ์ดช่องทางติดต่อ ================= */}
      <section className="max-w-[1240px] mx-auto px-4 md:px-10 -mt-2">
        {cards.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {cards.map(([ico, label, value, href, grad, hint]) => {
              const cls = 'card-pop rounded-[2rem] p-6 flex flex-col gap-4 group min-h-[176px]'
              const inner = (
                <>
                  <span className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${grad} grid place-items-center text-[26px] text-white shadow-soft wiggle`}>{ico}</span>
                  <span className="min-w-0">
                    <span className="block text-[12px] font-bold tracking-wide uppercase text-ink-muted">{label}</span>
                    <span className="block mt-1 text-[15px] font-bold text-ink break-all leading-snug">{value}</span>
                  </span>
                  {href && (
                    <span className="mt-auto text-[12.5px] font-semibold text-primary-deep inline-flex items-center gap-1.5 group-hover:gap-3 transition-all">{hint} <span>→</span></span>
                  )}
                </>
              )
              return href ? (
                <a key={label} href={href} className={cls}
                  {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                  {inner}
                </a>
              ) : (
                <div key={label} className={cls}>{inner}</div>
              )
            })}
          </div>
        ) : (
          <div className="card-soft rounded-[2rem] text-center py-14">
            <div className="text-5xl">📭</div>
            <p className="mt-3 text-ink-muted">ยังไม่ได้ระบุช่องทางติดต่อ</p>
          </div>
        )}

        {/* สถานที่ปฏิบัติงาน */}
        {profile?.school && (
          <div className="card-soft rounded-[2rem] p-6 md:p-8 mt-5 grid md:grid-cols-[auto_1fr_auto] gap-5 items-center">
            <span className="w-16 h-16 rounded-[1.4rem] grad-soft grid place-items-center text-[30px] shrink-0 float-slow">🏫</span>
            <div className="min-w-0">
              <span className="chip chip-primary">สถานที่ปฏิบัติงาน</span>
              <p className="text-[18px] md:text-[20px] font-extrabold mt-2 leading-tight">{profile.school}</p>
              <p className="text-[13px] text-ink-muted mt-1">
                {profile.affiliation}{profile.area_office ? ` · ${profile.area_office}` : ''}
              </p>
            </div>
            <Link href="/about" className="btn btn-ghost btn-sm justify-self-start md:justify-self-end">ประวัติครู →</Link>
          </div>
        )}
      </section>

      {/* ================= แบนเนอร์ CTA ================= */}
      <section className="max-w-[1240px] mx-auto px-4 md:px-10 pt-14 pb-6">
        <div className="relative overflow-hidden rounded-[2.2rem] grad-hero text-white px-7 md:px-12 py-10 md:py-12 grid md:grid-cols-[1fr_auto] items-center gap-8">
          <div className="absolute inset-0 dots opacity-25" />
          <div className="blob w-[300px] h-[300px] !opacity-40 bg-white -right-20 -bottom-32" />
          <div className="relative">
            <span className="chip chip-glass !text-ink">อยากดูผลงานทั้งหมดก่อน?</span>
            <h2 className="mt-3 text-[24px] md:text-[32px] font-extrabold leading-tight">
              แฟ้มสะสมผลงานตามเกณฑ์ วPA{' '}<br className="hidden md:block" />ครบ 15 ตัวชี้วัด
            </h2>
            <p className="mt-2.5 text-[14px] text-white/90 max-w-[560px]">ข้อตกลงในการพัฒนางาน ผลงาน 3 ด้าน และการพัฒนาตนเองทางวิชาชีพ</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/pa" className="btn btn-white text-[14px]">ข้อตกลง PA · 15 ตัวชี้วัด →</Link>
              <Link href="/development" className="btn text-[14px] bg-white/15 border-2 border-white/60 text-white hover:bg-white/25">🌱 การพัฒนาตนเอง</Link>
            </div>
          </div>
          <span className="relative w-[120px] h-[120px] rounded-[2rem] bg-white/20 backdrop-blur grid place-items-center text-[56px] shrink-0 float hidden md:grid">✨</span>
        </div>
      </section>
    </main>
  )
}
