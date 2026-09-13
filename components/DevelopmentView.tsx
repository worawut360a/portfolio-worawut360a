import Link from 'next/link'
import {
  getAwards, getSelfDevs, getSelfDevYears, getSelfDevYearStats,
  getSelfDevHours, getItemAttachmentCounts, type AttachCount,
} from '@/lib/queries'
import { thaiDate } from '@/lib/theme'
import { imageUrl, fileUrl, IMG } from '@/lib/media'
import YearSelect from '@/components/YearSelect'
import CountUp from '@/components/CountUp'

/**
 * หน้าการพัฒนาตนเองและวิชาชีพ + รางวัลและเกียรติคุณ
 * แปลงมาจาก development.php ของเว็บ PHP ให้โครงสร้างและข้อความตรงกัน
 */

const TYPE_CHIP: Record<string, string> = {
  'อบรม': 'chip-1', 'สัมมนา': 'chip-1', 'PLC': 'chip-2',
  'ศึกษาดูงาน': 'chip-3', 'วิทยากร': 'chip-accent',
}
const LEVEL_CHIP: Record<string, string> = {
  'โรงเรียน': 'chip-1', 'เขตพื้นที่': 'chip-2', 'จังหวัด': 'chip-3',
  'ภาค': 'chip-accent', 'ชาติ': 'chip-accent', 'นานาชาติ': 'chip-accent',
}

/** ข้อความชิป "🖼️ n · 📎 n" — คืนค่าว่างถ้าไม่มีอะไรแนบ */
const attachLabel = (counts: Map<number, AttachCount>, id: number): string => {
  const c = counts.get(id)
  const p: string[] = []
  if (c?.images) p.push(`🖼️ ${c.images}`)
  if (c?.files) p.push(`📎 ${c.files}`)
  return p.join(' · ')
}

export default async function DevelopmentView({ year }: { year?: number }) {
  const years = await getSelfDevYears()
  const fy = year && years.includes(year) ? year : (years[0] ?? new Date().getFullYear() + 544)

  const [awards, selfDev, hours, hoursAll, allDev, yearStats, awCounts, sdCounts] = await Promise.all([
    getAwards(), getSelfDevs(fy), getSelfDevHours(fy), getSelfDevHours(),
    getSelfDevs(), getSelfDevYearStats(),
    getItemAttachmentCounts('award'), getItemAttachmentCounts('self_dev'),
  ])

  const yearItems = years.map((y) => {
    const st = yearStats.get(y) ?? { n: 0, h: 0 }
    return { year: y, meta: `${st.n} รายการ · ${st.h} ชม.`, url: `/development/${y}`, active: y === fy }
  })

  return (
    <main>
      {/* ================= HERO ================= */}
      <section className="relative grad-pink text-white">
        {/* ชั้นตกแต่ง — clip เฉพาะชั้นนี้ ไม่ใส่ overflow-hidden ที่ section เพราะจะตัด dropdown เลือกปี */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 dots opacity-[.12]" />
          <div className="blob w-[360px] h-[360px] !opacity-20 bg-white -right-24 -top-20" />
          <span className="absolute right-4 -top-12 text-[190px] font-extrabold leading-none text-white/[.07] select-none hidden lg:block">3</span>
        </div>

        <div className="relative max-w-[1240px] mx-auto px-4 md:px-10 pt-10 md:pt-14 pb-10 md:pb-12">
          <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-end">
            <div>
              <span className="chip chip-glass !text-ink">🌱 ด้านที่ 3 · พัฒนาตนเองและวิชาชีพ</span>
              <h1 className="mt-3 text-[26px] md:text-[34px] font-extrabold leading-tight">การพัฒนา<span className="text-[color:var(--gold)]">ตนเอง</span></h1>
              <p className="mt-1.5 text-[13.5px] text-white/80">
                อบรม สัมมนา ชุมชนการเรียนรู้ทางวิชาชีพ (PLC) ศึกษาดูงาน<br />
                และการเป็นวิทยากร รวมถึงรางวัลและเกียรติคุณที่ได้รับ
              </p>
            </div>

            {/* สถิติรวมทุกปี */}
            <div className="flex gap-3">
              {([[hoursAll, 'ชม. รวมทุกปี'],
                 [allDev.length, 'รายการทั้งหมด'],
                 [awards.length, 'รางวัล']] as const).map(([num, label]) => (
                <div key={label} className="bg-white rounded-[1.4rem] px-5 py-3.5 shadow-lift text-center min-w-[112px]">
                  <span className="stat-num block"><CountUp to={num} /></span>
                  <span className="text-[11.5px] text-ink-muted font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {years.length > 0 && (
            <div className="mt-7">
              <YearSelect items={yearItems} />
            </div>
          )}
        </div>
      </section>

      {/* ================= การพัฒนาตนเอง ================= */}
      <section className="max-w-[1240px] mx-auto px-4 md:px-10 pt-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="chip chip-accent">🌱 ปีงบประมาณ {fy}</span>
            <h2 className="mt-3 text-[26px] md:text-[34px] font-extrabold leading-tight">รายการ<span className="grad-text">พัฒนาตนเอง</span></h2>
            <p className="text-[13.5px] text-ink-muted">อบรม สัมมนา PLC ศึกษาดูงาน และเป็นวิทยากร ในปีงบประมาณ {fy}</p>
          </div>
          <div className="glass rounded-[1.4rem] px-5 py-3.5 shadow-soft inline-flex items-center gap-4 self-start md:self-auto">
            <span className="w-11 h-11 rounded-2xl bg-mint-soft grid place-items-center text-xl">⏱️</span>
            <span>
              <span className="stat-num grad-text block"><CountUp to={hours} /></span>
              <span className="text-[11.5px] text-ink-muted font-medium">ชั่วโมงรวม · {selfDev.length} รายการ</span>
            </span>
          </div>
        </div>

        {selfDev.length === 0 ? (
          <div className="card-soft rounded-[2rem] text-center py-14 mt-7">
            <div className="text-5xl">🌱</div>
            <p className="mt-3 text-ink-muted">ยังไม่มีรายการพัฒนาตนเองในปีงบประมาณนี้</p>
          </div>
        ) : (
          <div className="card-soft rounded-[2rem] mt-7 divide-y divide-[color:var(--divider)] overflow-hidden">
            {selfDev.map((sd, i) => {
              const att = attachLabel(sdCounts, sd.id)
              const cert = fileUrl({ source: sd.certificate_source, ref: sd.certificate_ref })
              return (
                // ทั้งแถวเป็นลิงก์ด้วย overlay <a> เพื่อไม่ให้ปุ่มเกียรติบัตรกลายเป็นลิงก์ซ้อนลิงก์
                <div key={sd.id}
                  className="group relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-5 md:px-7 py-4 hover:bg-primary-soft/40 transition-colors">
                  <Link href={`/training/${sd.id}`} className="absolute inset-0 z-0"
                    aria-label={`ดูรายละเอียด ${sd.title}`} />
                  <span className="row-no relative z-10 self-start sm:self-center">{i + 1}</span>
                  <span className={`chip ${TYPE_CHIP[sd.type] ?? 'chip-1'} shrink-0 self-start sm:self-center`}>{sd.type}</span>
                  <p className="flex-1 min-w-0 text-[14px] font-semibold leading-snug group-hover:text-primary-deep transition-colors">
                    {sd.title}
                    {sd.organizer && <span className="text-ink-muted font-medium"> · {sd.organizer}</span>}
                  </p>
                  {/* flex-wrap + shrink-0 กันไม่ให้ปุ่มเกียรติบัตรถูกบีบจนแบนบนจอมือถือ */}
                  <div className="flex flex-wrap items-center gap-2.5 sm:flex-nowrap sm:shrink-0 text-[12.5px] text-ink-muted">
                    <span className="whitespace-nowrap shrink-0">
                      📅 {thaiDate(sd.start_date)}
                      {sd.end_date && sd.end_date !== sd.start_date ? `–${thaiDate(sd.end_date)}` : ''}
                    </span>
                    <span className="chip chip-glass !bg-white !border-[color:var(--border)] !text-[11.5px] text-ink shrink-0">{sd.hours} ชม.</span>
                    {att !== '' && (
                      <span className="chip chip-primary !text-[11px] !py-1 !px-2.5 whitespace-nowrap shrink-0">{att}</span>
                    )}
                    {cert && (
                      <a href={cert} target="_blank" rel="noopener noreferrer" title="ดูเกียรติบัตร" aria-label="ดูเกียรติบัตร"
                        className="relative z-10 w-11 h-11 shrink-0 rounded-2xl bg-sunny-soft grid place-items-center text-lg lift">📜</a>
                    )}
                    <span className="shrink-0 text-ink-faint group-hover:text-primary-deep group-hover:translate-x-1 transition-all" aria-hidden="true">→</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ================= รางวัลและเกียรติคุณ ================= */}
      {awards.length > 0 && (
        <section className="max-w-[1240px] mx-auto px-4 md:px-10 pt-16 pb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div>
              <span className="chip chip-accent">🏅 {awards.length} รางวัล</span>
              <h2 className="mt-3 text-[26px] md:text-[34px] font-extrabold leading-tight">รางวัลและ<span className="grad-text">เกียรติคุณ</span></h2>
            </div>
            <p className="text-[13.5px] text-ink-muted md:max-w-[360px]">คลิกที่รางวัลเพื่อดูรายละเอียด รูปภาพ และไฟล์แนบทั้งหมด</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-7">
            {awards.map((aw) => {
              const att = attachLabel(awCounts, aw.id)
              return (
                <Link key={aw.id} href={`/award/${aw.id}`} className="card-pop overflow-hidden rounded-[2rem] block group">
                  <div className="relative aspect-[4/3] bg-[color:var(--divider)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl({ source: aw.image_source, ref: aw.image_ref }, IMG.card)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={aw.title} loading="lazy" />
                    <span className={`absolute left-3 top-3 chip ${LEVEL_CHIP[aw.level] ?? 'chip-1'} shadow-soft`}>ระดับ{aw.level}</span>
                    {att !== '' && (
                      <span className="absolute left-3 bottom-3 chip chip-glass !text-[11px] !py-1 !px-2.5 shadow-soft">{att}</span>
                    )}
                    <span className="absolute right-3 bottom-3 w-9 h-9 rounded-full glass grid place-items-center text-sm opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">→</span>
                  </div>
                  <div className="p-5">
                    <p className="text-[14.5px] font-bold leading-snug line-2 group-hover:text-primary-deep transition-colors">{aw.title}</p>
                    <p className="text-[12px] text-ink-muted mt-1.5">🏛️ {aw.awarder} · {thaiDate(aw.award_date)}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </main>
  )
}
