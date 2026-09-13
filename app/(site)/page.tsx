import Link from 'next/link'
import {
  getProfile, getDomains, getIndicators, getWorkCountByIndicator,
  getWorks, getHomeStats, getAgreements, getAgreement,
  getPaDetails, getPaChallenges,
} from '@/lib/queries'
import { imageUrl, IMG } from '@/lib/media'
import { domainTheme, currentAcademicYear } from '@/lib/theme'
import WorkCard from '@/components/WorkCard'
import CountUp from '@/components/CountUp'

export const metadata = { title: 'หน้าแรก' }

/**
 * หน้าแรก — แปลงมาจาก index.php ของเว็บ PHP ให้โครงสร้างและข้อความตรงกัน
 *   HERO → ความครบถ้วนของแฟ้ม → 3 ด้าน → ผลงานล่าสุด → แบนเนอร์ PA
 */
export default async function HomePage() {
  const [profile, domains, indicators, byInd, latest, stats, agreements] = await Promise.all([
    getProfile(), getDomains(), getIndicators(), getWorkCountByIndicator(),
    getWorks({ limit: 6 }), getHomeStats(), getAgreements(),
  ])
  const agreement = agreements[0] ?? null
  const [paDetails, challenges] = agreement
    ? await Promise.all([getPaDetails(agreement.id), getPaChallenges(agreement.id)])
    : [[], []]

  const month = new Date().getMonth() + 1
  const semester = month >= 11 || month <= 3 ? 2 : 1
  const pct = stats.indicator_total
    ? Math.round((stats.filled_total / stats.indicator_total) * 100) : 0

  // แยกชื่อ–สกุลเป็นสองท่อน เพื่อให้ท่อนหลังเป็นสีทองเหมือนเว็บ PHP
  const nameParts = (profile?.full_name ?? '').trim().split(/\s+/)
  const firstName = nameParts[0] ?? ''
  const lastName = nameParts.slice(1).join(' ')

  const R = 50
  const C = 2 * Math.PI * R

  return (
    <main>
      {/* ================= HERO (น้ำเงิน–ทอง ทางการ) ================= */}
      <section className="relative overflow-hidden grad-hero text-white">
        <div className="absolute inset-0 dots opacity-[.12]" />
        <div className="blob blob-2 w-[360px] h-[360px] -right-24 -top-16 !opacity-25" />

        <div className="relative max-w-[1240px] mx-auto px-4 md:px-10 pt-8 md:pt-12 pb-10 md:pb-14
                        grid lg:grid-cols-[1.15fr_.85fr] gap-8 lg:gap-12 items-center">
          {/* ข้อความ */}
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <span className="chip bg-white/10 text-white border border-white/25">
                ปีการศึกษา {currentAcademicYear()} · ภาคเรียนที่ {semester}
              </span>
              <span className="chip chip-grad">วPA ว9/2564</span>
            </div>

            <p className="mt-5 text-[13.5px] text-white/80">แฟ้มสะสมผลงานอิเล็กทรอนิกส์ (e-Portfolio)</p>
            <h1 className="hero-title mt-4 md:mt-5 font-extrabold leading-[1.3] tracking-tight">
              {firstName} <span className="text-[color:var(--gold)]">{lastName}</span>
            </h1>

            <div className="mt-5 flex flex-col gap-1">
              <p className="hero-sub font-bold text-[color:var(--gold-line)]">
                {profile?.position} วิทยฐานะ{profile?.academic_standing}
              </p>
              <p className="text-[15px] md:text-[17px] font-semibold text-white/95">กลุ่มสาระ{profile?.subject_group}</p>
              <p className="text-[13.5px] md:text-[14px] text-white/70">{profile?.school} · {profile?.area_office}</p>
            </div>

            {profile?.motto && (
              <p className="mt-4 inline-flex items-center gap-2.5 border-l-[3px] border-[color:var(--gold)] pl-3.5 py-1 italic text-[14px] text-white/90">
                “{profile.motto}”
              </p>
            )}

            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link href="/pa" className="btn btn-gold">ดูผลงานทั้งหมด →</Link>
              <Link href="/development" className="btn bg-white/10 text-white border border-white/35 hover:bg-white/20">การพัฒนาตนเอง</Link>
            </div>

            {/* สถิติ */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {([[stats.total_works, 'ผลงานทั้งหมด'],
                 [stats.self_dev_hours, 'ชม.พัฒนาตนเอง'],
                 [stats.awards, 'รางวัล'],
                 [pct, '% ความครบถ้วน']] as const).map(([num, label]) => (
                <div key={label} className="rounded-xl bg-white/10 border border-white/20 px-3.5 py-3">
                  <div className="text-[22px] md:text-[24px] font-bold leading-none text-[color:var(--gold)]">
                    <CountUp to={num} />{label === '% ความครบถ้วน' ? '%' : ''}
                  </div>
                  <div className="text-[11px] text-white/75 mt-1.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* รูปครู (มือถือ: ขึ้นก่อนข้อความ) */}
          <div className="relative min-w-0 flex justify-center lg:justify-end order-first lg:order-none mt-2 lg:mt-0">
            <div className="relative w-full max-w-[320px]">
              <div className="relative rounded-2xl p-[3px] bg-[color:var(--gold)] shadow-lg">
                <div className="rounded-[13px] overflow-hidden aspect-[4/5] bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl({ source: profile?.avatar_source ?? null, ref: profile?.avatar_ref ?? null }, IMG.avatar)}
                    alt={`รูปครู${profile?.nickname ?? ''}`}
                    className="w-full h-full object-cover object-top" />
                </div>
              </div>
              <div className="sticker absolute -left-4 md:-left-8 bottom-8 !py-2 !px-3">
                <span className="w-8 h-8 rounded-lg bg-[color:var(--gold-soft)] grid place-items-center text-base">🏆</span>
                <span className="leading-tight">
                  <span className="block font-bold text-[13.5px] text-ink">{stats.awards} รางวัล</span>
                  <span className="block text-[10px] text-ink-muted">ระดับเขต–ระดับชาติ</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= ความครบถ้วนของแฟ้ม ================= */}
      <section className="max-w-[1240px] mx-auto px-4 md:px-10 -mt-2">
        <div className="card-soft rounded-[2rem] px-6 md:px-9 py-7 grid lg:grid-cols-[auto_1fr] gap-7 items-center">
          {/* วงกลม % */}
          <div className="flex items-center gap-5">
            <div className="relative w-[110px] h-[110px] shrink-0">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r={R} fill="none" stroke="#EEEDF7" strokeWidth="14" />
                <circle cx="60" cy="60" r={R} fill="none" stroke="url(#gradRing)" strokeWidth="14" strokeLinecap="round"
                  strokeDasharray={C.toFixed(1)} strokeDashoffset={(C * (1 - pct / 100)).toFixed(1)}
                  style={{ transition: 'stroke-dashoffset 1.2s var(--ease-pop)' }} />
                <defs>
                  <linearGradient id="gradRing" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="var(--primary)" /><stop offset="1" stopColor="var(--primary-2)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <span className="text-[24px] font-extrabold leading-none"><CountUp to={pct} />%</span>
              </div>
            </div>
            <div>
              <h2 className="font-bold text-[18px] md:text-[20px]">ความครบถ้วนของแฟ้ม</h2>
              <p className="text-[13px] text-ink-muted mt-0.5">
                มีผลงานแล้ว <b className="text-ink">{stats.filled_total}</b> จาก {stats.indicator_total} ตัวชี้วัด
              </p>
            </div>
          </div>

          <div className="w-full">
            <div className="flex gap-1.5" role="img" aria-label="แถบความครบถ้วน 15 ตัวชี้วัด">
              {indicators.map((ind) => {
                const has = (byInd.get(ind.id) ?? 0) > 0
                const t = domainTheme(ind.domain_code)
                return (
                  <span key={ind.id} className="flex-1 h-3.5 rounded-full transition-transform hover:scale-y-150"
                    title={`${ind.code} ${ind.name}`}
                    style={{ background: has ? t.solid : '#EEEDF7' }} />
                )
              })}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1.5 mt-3.5 text-[12.5px] text-ink-muted font-medium">
              {domains.map((d) => {
                const t = domainTheme(d.code)
                return (
                  <span key={d.id} className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: t.solid }} />
                    ด้านที่ {d.code} · <b className="text-ink">{stats.filled.get(d.code) ?? 0}</b>/{stats.total_per_domain.get(d.code) ?? 0}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ================= 3 ด้าน ================= */}
      <section className="max-w-[1240px] mx-auto px-4 md:px-10 pt-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <span className="chip chip-primary">3 ด้าน · {stats.indicator_total} ตัวชี้วัด</span>
            <h2 className="mt-3 text-[26px] md:text-[34px] font-extrabold leading-tight">ผลงานตามเกณฑ์ <span className="grad-text">วPA</span></h2>
          </div>
          <p className="text-[13.5px] text-ink-muted md:max-w-[360px]">มาตรฐานตำแหน่งและวิทยฐานะ ว9/2564 · คลิกที่ด้านเพื่อดูตัวชี้วัดในข้อตกลง PA</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mt-7">
          {domains.map((d) => {
            const code = d.code
            const t = domainTheme(code)
            const nInd = stats.total_per_domain.get(code) ?? 0
            const nW = stats.works_by_domain.get(code) ?? 0
            const fill = stats.filled.get(code) ?? 0
            const p = nInd ? Math.round((fill / nInd) * 100) : 0
            return (
              <Link key={d.id} href={`/pa#d${code}`}
                className="group relative overflow-hidden rounded-[2rem] p-7 text-white block lift"
                style={{ background: t.grad }}>
                <span className="absolute -right-2 -top-6 text-[140px] font-extrabold leading-none text-white/15 group-hover:scale-110 transition-transform duration-500 select-none">{code}</span>
                <div className="absolute inset-0 dots opacity-20" />
                <div className="relative">
                  <span className="w-14 h-14 rounded-2xl bg-white/25 backdrop-blur grid place-items-center text-[26px] wiggle">{d.icon}</span>
                  <p className="mt-5 text-[12px] font-bold tracking-[.14em] uppercase text-white/85">ด้านที่ {code}</p>
                  <h3 className="text-[21px] font-bold mt-1 leading-snug">{d.name}</h3>

                  <div className="mt-5 flex items-center justify-between text-[12px] font-semibold text-white/90">
                    <span>{fill}/{nInd} ตัวชี้วัด</span><span>{nW} ผลงาน</span>
                  </div>
                  <div className="mt-2 h-2.5 rounded-full bg-white/30 overflow-hidden">
                    <span className="block h-full rounded-full bg-white" style={{ width: `${p}%` }} />
                  </div>
                  <p className="mt-5 text-[13.5px] font-semibold inline-flex items-center gap-1.5 group-hover:gap-3 transition-all">ดูตัวชี้วัดด้านนี้ <span>→</span></p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ================= ผลงานล่าสุด ================= */}
      <section className="max-w-[1240px] mx-auto px-4 md:px-10 pt-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <span className="chip chip-accent">✨ อัปเดตล่าสุด</span>
            <h2 className="mt-3 text-[26px] md:text-[34px] font-extrabold leading-tight">ผลงาน<span className="grad-text">ล่าสุด</span></h2>
          </div>
          <Link href="/pa" className="btn btn-ghost btn-sm">ดูทั้งหมด {stats.total_works} ชิ้น →</Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-7">
          {latest.map((w) => <WorkCard key={w.id} work={w} />)}
        </div>

        {latest.length === 0 && (
          <div className="card-soft rounded-[2rem] text-center py-14 mt-6">
            <div className="text-5xl">🗂️</div>
            <p className="mt-3 text-ink-muted">ยังไม่มีผลงานเผยแพร่ · เข้าสู่ระบบเพื่อเพิ่มผลงานชิ้นแรก</p>
          </div>
        )}
      </section>

      {/* ================= แบนเนอร์ PA ================= */}
      {agreement && (
        <section className="max-w-[1240px] mx-auto px-4 md:px-10 pt-16 pb-4">
          <div className="relative overflow-hidden rounded-[2.2rem] grad-hero text-white px-7 md:px-12 py-10 md:py-12 grid md:grid-cols-[1fr_auto] items-center gap-8">
            <div className="absolute inset-0 dots opacity-25" />
            <div className="blob w-[300px] h-[300px] !opacity-40 bg-white -right-20 -bottom-32" />
            <div className="relative">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="chip chip-glass !text-ink">ล่าสุด · รอบที่ {agreement.round}</span>
              </div>
              <h2 className="mt-3 text-[24px] md:text-[32px] font-extrabold leading-tight">
                ข้อตกลงในการพัฒนางาน (PA){' '}<br className="hidden md:block" />ปีงบประมาณ {agreement.fiscal_year}
              </h2>
              <p className="mt-2.5 text-[14px] text-white/90 max-w-[560px]">
                ครบทั้ง {paDetails.length} ตัวชี้วัด
                {challenges[0] && <> · ประเด็นท้าทาย “{challenges[0].topic.slice(0, 60)}”</>}
                {' '}· เก็บข้อมูลแยกรายปีงบประมาณ
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/pa/${agreement.fiscal_year}`} className="btn btn-white text-[14px]">เปิดอ่านข้อตกลง {agreement.fiscal_year} →</Link>
                <Link href="/pa" className="btn text-[14px] bg-white/15 border-2 border-white/60 text-white hover:bg-white/25">ปีย้อนหลัง ({agreements.length} ปี)</Link>
              </div>
            </div>
            <span className="relative w-[120px] h-[120px] rounded-[2rem] bg-white/20 backdrop-blur grid place-items-center text-[56px] shrink-0 float hidden md:grid">📋</span>
          </div>
        </section>
      )}
    </main>
  )
}
