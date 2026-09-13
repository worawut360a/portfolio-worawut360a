import Link from 'next/link'
import AdminOnly from '@/components/AdminOnly'
import { notFound } from 'next/navigation'
import {
  getProfile, getAgreements, getAgreement, getPaChallenges,
  getDomains, getIndicatorOverviewGrouped,
} from '@/lib/queries'
import { domainTheme, thaiDate } from '@/lib/theme'
import { fileUrl } from '@/lib/media'
import YearSelect from '@/components/YearSelect'
import CountUp from '@/components/CountUp'
import DomainAccordion from '@/components/DomainAccordion'

/**
 * หน้าข้อตกลงในการพัฒนางาน (PA)
 * แปลงมาจาก pa-agreement.php ของเว็บ PHP ให้โครงสร้างและข้อความตรงกัน
 *   HERO → แบนเนอร์ปี → ตอนที่ 1 → ตอนที่ 2 (15 ตัวชี้วัด) → ตอนที่ 3 + PDF → ปีงบประมาณอื่น
 */

const STATUS: Record<string, string> = {
  draft: 'ฉบับร่าง', in_progress: 'กำลังดำเนินการ', evaluated: 'ประเมินแล้ว',
}

/** ตัดศูนย์ท้ายทศนิยมแบบเดียวกับ rtrim(rtrim(number_format(..),'0'),'.') ใน PHP */
const trimNum = (v: number | null | undefined, digits = 1): string => {
  const n = Number(v ?? 0)
  return n.toFixed(digits).replace(/\.?0+$/, '')
}

export default async function PaView({ year }: { year?: number }) {
  const agreements = await getAgreements()
  if (agreements.length === 0) {
    return (
      <div className="max-w-[820px] mx-auto px-4 py-24 text-center">
        <div className="card-soft rounded-[2rem] p-12">
          <div className="text-5xl">📋</div>
          <h1 className="mt-3 text-2xl font-extrabold">ยังไม่มีข้อตกลง <span className="grad-text">PA</span></h1>
          <p className="mt-2 text-[14px] text-ink-muted">เจ้าของเว็บยังไม่ได้บันทึกข้อตกลงในการพัฒนางาน</p>
        </div>
      </div>
    )
  }

  const cur = (year ? await getAgreement(year) : null) ?? agreements[0]!
  if (!cur) notFound()

  const [profile, overview, challenges, domains] = await Promise.all([
    getProfile(), getIndicatorOverviewGrouped(cur.id), getPaChallenges(cur.id), getDomains(),
  ])

  const isLatest = cur.fiscal_year === agreements[0]!.fiscal_year
  let paFilled = 0
  let totalWorks = 0
  for (const rows of overview.values()) {
    for (const r of rows) { if (r.pa) paFilled++; totalWorks += r.work_count }
  }
  const pdf = fileUrl({ source: cur.pdf_source, ref: cur.pdf_ref })
  const others = agreements.filter((a) => a.id !== cur.id)

  const yearItems = agreements.map((a) => ({
    year: a.fiscal_year,
    meta: a.status === 'evaluated' ? '✓ ผ่านการประเมิน'
      : a.status === 'in_progress' ? 'กำลังดำเนินการ' : 'ฉบับร่าง',
    url: `/pa/${a.fiscal_year}`,
    active: a.id === cur.id,
  }))

  const info: [string, string, string, string][] = [
    ['ชื่อ–สกุล', profile?.full_name ?? '', '👤', 'bg-coral-soft'],
    ['ตำแหน่ง / วิทยฐานะ',
      [cur.position || profile?.position, cur.academic_standing || profile?.academic_standing]
        .filter(Boolean).join(' / '), '🎖️', 'bg-sunny-soft'],
    ['สถานศึกษา', cur.school || profile?.school || '', '🏫', 'bg-mint-soft'],
    ['สังกัด', cur.affiliation || profile?.area_office || '', '🏛️', 'bg-sky-soft'],
    ['รอบการประเมิน', `${thaiDate(cur.period_start)} – ${thaiDate(cur.period_end)}`, '📅', 'bg-coral-soft'],
    ['ชั่วโมงสอน', `${trimNum(cur.teaching_hours)} ชั่วโมง/สัปดาห์`, '⏰', 'bg-sunny-soft'],
    ['งานส่งเสริมสนับสนุน', `${trimNum(cur.support_hours)} ชั่วโมง/สัปดาห์`, '🤝', 'bg-mint-soft'],
    ['กลุ่มสาระ', cur.subject_group || profile?.subject_group || '', '📖', 'bg-sky-soft'],
  ]

  return (
    <main>
      {/* ================= HERO ================= */}
      <section className="relative grad-hero text-white">
        {/* ชั้นตกแต่ง — clip เฉพาะชั้นนี้ ไม่ใส่ overflow-hidden ที่ section เพราะจะตัด dropdown เลือกปี */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 dots opacity-[.12]" />
          <div className="blob blob-2 w-[360px] h-[360px] -right-24 -top-16 !opacity-25" />
          <span className="absolute right-2 -top-10 text-[190px] font-extrabold leading-none text-white/[.07] select-none hidden md:block">PA</span>
        </div>

        <div className="relative max-w-[1240px] mx-auto px-4 md:px-10 pt-10 md:pt-14 pb-16 md:pb-20">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="chip chip-glass !text-ink">📋 แบบบันทึกข้อตกลง PA1/ส</span>
              <span className="chip chip-grad">วPA ว9/2564</span>
            </div>
            <h1 className="mt-4 text-[30px] md:text-[44px] font-extrabold leading-[1.1] tracking-tight">
              ข้อตกลงในการพัฒนางาน <span className="text-[color:var(--gold)]">(PA)</span>{' '}
              <br className="hidden md:block" />และผลงาน 15 ตัวชี้วัด
            </h1>
            <p className="mt-3 text-[13.5px] md:text-[15px] text-white/80 max-w-[640px]">
              จัดเก็บแยกรายปีงบประมาณ · <b className="text-[color:var(--gold-line)]">คลิกที่ตัวชี้วัดเพื่อดูผลงานและหลักฐานของตัวชี้วัดนั้น</b>
            </p>
          </div>

          <div className="mt-7">
            <YearSelect items={yearItems} note="ข้อมูลแต่ละปีแยกจากกัน" />
          </div>
        </div>
      </section>

      <div className="max-w-[1240px] mx-auto px-4 md:px-10 pb-10">

        {/* ================= แบนเนอร์ปีที่กำลังดู ================= */}
        <div className="relative overflow-hidden rounded-[2rem] bg-[color:var(--gold-line)] border-2 border-[color:var(--gold)] px-6 md:px-10 py-8 md:py-9 -mt-10 shadow-lift
                        flex flex-col lg:flex-row lg:items-center justify-between gap-7">
          <span className="absolute -right-3 -top-8 text-[150px] font-extrabold leading-none text-white/55 select-none pointer-events-none hidden md:block">{cur.fiscal_year}</span>

          <div className="relative min-w-0">
            <div className="flex gap-2 items-center flex-wrap">
              {isLatest && <span className="chip chip-ink">✨ ปีล่าสุด</span>}
              <span className="chip bg-white text-ink">รอบที่ {cur.round}</span>
              <span className="chip bg-white text-ink">{STATUS[cur.status] ?? '—'}</span>
            </div>
            <h2 className="mt-3 text-[24px] md:text-[30px] font-extrabold leading-tight text-ink">
              ข้อตกลง PA ปีงบประมาณ <span className="text-primary">{cur.fiscal_year}</span>
            </h2>
            <p className="mt-1.5 text-[13.5px] text-ink-soft">
              ระยะเวลา {thaiDate(cur.period_start)} – {thaiDate(cur.period_end)}
              {cur.evaluation_score !== null && (
                <> · ผลการประเมิน: <b className="text-ink">
                  {cur.evaluation_result === 'pass' ? 'ผ่าน' : 'ไม่ผ่าน'} (ร้อยละ {trimNum(cur.evaluation_score, 2)})
                </b></>
              )}
            </p>
          </div>

          <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            {([['📌', paFilled, '/15', 'ตัวชี้วัด'],
               ['📚', totalWorks, '', 'ผลงาน'],
               ['🎯', challenges.length, '', 'ประเด็นท้าทาย']] as const).map(([ico, num, suffix, label]) => (
              <div key={label} className="bg-white rounded-2xl px-4 py-3 min-w-[110px] text-center shadow-sm">
                <div className="text-[22px] md:text-[26px] font-extrabold leading-none text-primary">
                  <CountUp to={num} />{suffix}
                </div>
                <div className="text-[11px] text-ink-muted font-medium mt-1">{ico} {label}</div>
              </div>
            ))}
            <div className="bg-white rounded-2xl px-4 py-3 min-w-[110px] text-center shadow-sm">
              <div className="text-[22px] md:text-[26px] font-extrabold leading-none text-primary">{cur.pdf_ref ? 'PDF' : '—'}</div>
              <div className="text-[11px] text-ink-muted font-medium mt-1">📎 ไฟล์แนบ</div>
            </div>
          </div>
        </div>

        {/* ================= ตอนที่ 1 ================= */}
        <section className="pt-14">
          <div>
            <span className="chip chip-primary">👤 ตอนที่ 1</span>
            <h2 className="mt-3 text-[26px] md:text-[34px] font-extrabold leading-tight">ข้อมูล<span className="grad-text">ผู้จัดทำข้อตกลง</span></h2>
            <p className="text-[13.5px] text-ink-muted">ข้อมูลตำแหน่ง สังกัด และภาระงานตามที่บันทึกไว้ในปีงบประมาณ {cur.fiscal_year}</p>
          </div>

          <div className="mt-7 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {info.map(([k, v, ico, bg]) => (
              <div key={k} className="card-soft rounded-[1.6rem] px-5 py-4 flex items-start gap-3.5">
                <span className={`w-11 h-11 rounded-2xl ${bg} grid place-items-center text-xl shrink-0`}>{ico}</span>
                <div className="min-w-0">
                  <div className="text-[11px] text-ink-muted font-medium">{k}</div>
                  <div className="text-[14px] font-bold mt-0.5 leading-snug break-words">{v}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============ ตอนที่ 2 · ตัวชี้วัด 15 ตัว (กดได้ → เปิดหน้ารายละเอียดตัวชี้วัด) ============ */}
        <section className="pt-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div>
              <span className="chip chip-primary">🔖 ตอนที่ 2</span>
              <h2 className="mt-3 text-[26px] md:text-[34px] font-extrabold leading-tight">ข้อตกลงในการพัฒนางาน <span className="grad-text">15 ตัวชี้วัด</span></h2>
            </div>
            <p className="text-[13.5px] text-ink-muted md:max-w-[360px]">👆 แตะที่ตัวชี้วัดเพื่อดูผลงานและหลักฐาน · ย่อ/ขยายแต่ละด้านได้จากแถบหัวเรื่อง</p>
          </div>

          {domains.map((d) => {
            const dc = d.code
            const t = domainTheme(dc)
            const rows = overview.get(dc) ?? []
            const dWorks = rows.reduce((s, r) => s + r.work_count, 0)
            return (
              <div key={d.id} id={`d${dc}`}
                className="mt-6 card-soft rounded-[1.8rem] overflow-hidden scroll-mt-24"
                style={{ ['--acc-bg' as string]: t.grad }}>
                <DomainAccordion header={
                  <>
                    <span className="absolute inset-0 dots opacity-20 pointer-events-none" />
                    <span className="absolute -right-1 -top-6 text-[96px] font-extrabold leading-none text-white/15 select-none pointer-events-none">{dc}</span>
                    <span className="relative w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-white/25 backdrop-blur grid place-items-center text-[22px] shrink-0">{d.icon}</span>
                    <span className="relative flex-1 min-w-0">
                      <span className="block text-[11px] font-bold tracking-[.14em] uppercase text-white/85">ด้านที่ {dc}</span>
                      <span className="block text-[15px] md:text-[18px] font-bold leading-snug">{d.name}</span>
                      <span className="block text-[12px] text-white/90 font-medium mt-0.5">{rows.length} ตัวชี้วัด · {dWorks} ผลงาน</span>
                    </span>
                  </>
                }>
                  {rows.map((r) => (
                    <Link key={r.id} href={`/indicator/${r.id}`}
                      className="ind-link card-pop group block rounded-[1.4rem] p-4 md:p-5">
                      <div className="flex items-start gap-3.5">
                        <span className="shrink-0 w-[54px] h-9 rounded-xl grid place-items-center text-[12.5px] font-extrabold text-white shadow-soft"
                          style={{ background: t.grad }}>{r.code}</span>

                        <div className="min-w-0 flex-1">
                          <p className="text-[14.5px] font-bold leading-snug group-hover:text-primary-deep transition-colors">{r.name}</p>

                          {r.pa ? (
                            <>
                              <p className="mt-1.5 text-[12.5px] text-ink-soft leading-relaxed">
                                <b style={{ color: t.solid }}>งานที่จะปฏิบัติ:</b> {r.pa.task_description}
                              </p>
                              <p className="mt-1.5 text-[11.5px] text-ink-muted leading-relaxed">
                                <b className="text-mint-deep">เชิงปริมาณ:</b> {r.pa.expected_quantity || '—'}
                                &nbsp;·&nbsp;
                                <b className="text-sky-deep">เชิงคุณภาพ:</b> {r.pa.expected_quality || '—'}
                              </p>
                            </>
                          ) : (
                            <p className="mt-1.5 text-[12px] text-ink-faint italic">ยังไม่ได้กรอกข้อตกลงของตัวชี้วัดนี้ในปีงบประมาณ {cur.fiscal_year}</p>
                          )}
                        </div>

                        <div className="shrink-0 flex flex-col items-end gap-2 pl-1">
                          <span className={`chip ${r.work_count ? `chip-${dc}` : 'bg-[color:var(--divider)] text-ink-faint'} whitespace-nowrap`}>
                            📚 {r.work_count} ผลงาน
                          </span>
                          <span className="w-9 h-9 rounded-full grid place-items-center font-extrabold text-white transition-transform group-hover:translate-x-1"
                            style={{ background: t.grad }} aria-hidden="true">→</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </DomainAccordion>
              </div>
            )
          })}
        </section>

        {/* ================= ตอนที่ 3 + PDF ================= */}
        <section className="pt-16">
          <div>
            <span className="chip chip-accent">🎯 ตอนที่ 3</span>
            <h2 className="mt-3 text-[26px] md:text-[34px] font-extrabold leading-tight">ประเด็น<span className="grad-text">ท้าทาย</span> ปีงบประมาณ {cur.fiscal_year}</h2>
            <p className="text-[13.5px] text-ink-muted">ประเด็นท้าทายในการพัฒนาผลลัพธ์การเรียนรู้ของผู้เรียน พร้อมเอกสารแบบบันทึกข้อตกลงฉบับเต็ม</p>
          </div>

          <div className="mt-7 grid lg:grid-cols-[1.25fr_.75fr] gap-5 items-start">
            <div className="grid gap-4">
              {challenges.length === 0 && (
                <div className="card-soft rounded-[2rem] text-center py-14">
                  <div className="text-5xl">🎯</div>
                  <p className="mt-3 text-ink-muted">ยังไม่ได้บันทึกประเด็นท้าทายของปีงบประมาณนี้</p>
                </div>
              )}

              {challenges.map((c, ci) => (
                <article key={c.id} className="relative overflow-hidden card-soft rounded-[2rem] p-6 md:p-8 pl-8 md:pl-10">
                  <span className="absolute left-0 inset-y-0 w-2 grad-bg" aria-hidden="true" />
                  <span className="chip chip-grad !text-[11px]">🎯 ประเด็นท้าทาย{challenges.length > 1 ? ` ${ci + 1}` : ''}</span>
                  <h3 className="mt-3 text-[18px] md:text-[21px] font-extrabold leading-snug">{c.topic}</h3>
                  <div className="mt-5 grid md:grid-cols-3 gap-3">
                    {([['สภาพปัญหา', c.problem_statement, '🔍'],
                       ['วิธีดำเนินการ', c.method, '🛠️'],
                       ['ผลลัพธ์ที่คาดหวัง', c.expected_outcome, '🌟']] as const).map(([k, v, ico]) => (
                      <div key={k} className="grad-soft rounded-2xl px-4 py-4">
                        <div className="text-[11.5px] font-extrabold text-primary-deep">{ico} {k}</div>
                        <p className="mt-1.5 text-[12.5px] text-ink-soft leading-relaxed">{v}</p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            {/* เอกสาร PDF */}
            <div className="grid gap-4">
              {pdf ? (
                <div className="relative overflow-hidden rounded-[2rem] grad-bg text-white p-6 md:p-7 shadow-glow">
                  <div className="absolute inset-0 dots opacity-25" />
                  <div className="blob w-[200px] h-[200px] !opacity-40 bg-white -right-16 -top-20" />
                  <div className="relative">
                    <span className="w-14 h-14 rounded-2xl bg-white/25 backdrop-blur grid place-items-center text-[28px] float">📕</span>
                    <h3 className="mt-4 text-[19px] font-extrabold leading-tight">เอกสารแบบบันทึกข้อตกลง</h3>
                    <p className="mt-1 text-[12.5px] text-white/90">ไฟล์ PA1/ส ฉบับเต็มของปีงบประมาณ {cur.fiscal_year}</p>

                    <div className="mt-4 flex items-center gap-3 glass rounded-2xl px-4 py-3 text-ink">
                      <span className="text-[22px] shrink-0">📄</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-bold truncate">{cur.pdf_name || 'แบบบันทึกข้อตกลง.pdf'}</span>
                        <span className="block text-[11px] text-ink-muted">
                          {cur.pdf_source === 'drive' ? 'เก็บใน Google Drive' : 'ไฟล์ในระบบ'}
                          {cur.updated_at ? ` · อัปเดต ${thaiDate(String(cur.updated_at).slice(0, 10))}` : ''}
                        </span>
                      </span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <a href={pdf} target="_blank" rel="noopener noreferrer" className="btn btn-white flex-1 text-[13px]">👀 ดูออนไลน์</a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card-soft rounded-[2rem] p-6 text-center">
                  <span className="w-14 h-14 mx-auto rounded-2xl bg-primary-soft grid place-items-center text-[28px]">📄</span>
                  <h3 className="mt-4 text-[17px] font-extrabold">เอกสารแบบบันทึกข้อตกลง</h3>
                  <p className="mt-1.5 text-[13px] text-ink-muted">ยังไม่ได้แนบไฟล์ PDF ของปีงบประมาณนี้</p>
                  <AdminOnly>
                    <Link href={`/admin/pa?id=${cur.id}`} className="btn btn-primary w-full mt-4 text-[13px]">📎 แนบไฟล์ PDF</Link>
                  </AdminOnly>
                </div>
              )}

              {cur.note && (
                <div className="card-soft rounded-[1.6rem] px-5 py-4 flex items-start gap-3">
                  <span className="w-10 h-10 rounded-xl bg-sunny-soft grid place-items-center text-lg shrink-0">💡</span>
                  <p className="text-[12.5px] text-ink-soft leading-relaxed">{cur.note}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ================= ปีงบประมาณอื่น ================= */}
        {others.length > 0 && (
          <section className="pt-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
              <div>
                <span className="chip chip-primary">🗂️ ย้อนหลัง</span>
                <h2 className="mt-3 text-[26px] md:text-[34px] font-extrabold leading-tight">ปีงบประมาณ<span className="grad-text">อื่น</span></h2>
              </div>
              <p className="text-[13.5px] text-ink-muted">คลิกเพื่อเปิดดูข้อตกลงฉบับเต็มของปีนั้น</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-7">
              {others.map((a) => {
                const done = a.status === 'evaluated'
                return (
                  <Link key={a.id} href={`/pa/${a.fiscal_year}`}
                    className="card-pop group rounded-[1.8rem] p-5 flex items-center gap-4">
                    <span className={`w-[56px] h-[56px] rounded-2xl grid place-items-center text-[24px] shrink-0 ${done ? 'bg-mint-soft' : 'bg-sunny-soft'} group-hover:scale-110 transition-transform`}>
                      {done ? '✅' : '📝'}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[11px] font-bold tracking-[.12em] uppercase text-ink-muted">ปีงบประมาณ</span>
                      <span className="block font-extrabold text-[22px] leading-none mt-0.5">{a.fiscal_year}</span>
                      <span className="block text-[12px] text-ink-muted mt-1.5 leading-snug">
                        รอบที่ {a.round} ·{' '}
                        {a.evaluation_score !== null ? (
                          <b className="text-mint-deep">{a.evaluation_result === 'pass' ? 'ผ่าน' : 'ไม่ผ่าน'} (ร้อยละ {trimNum(a.evaluation_score, 2)})</b>
                        ) : 'กำลังดำเนินการ'}
                        {' '}· {a.detail_count} ตัวชี้วัด · {a.pdf_ref ? 'PDF 1 ไฟล์' : 'ไม่มี PDF'}
                      </span>
                    </span>
                    <span className="w-9 h-9 rounded-full grad-bg text-white grid place-items-center font-extrabold shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
