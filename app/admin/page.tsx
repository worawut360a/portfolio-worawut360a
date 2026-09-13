import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import {
  getProfile, getDomains, getIndicators, getAgreements,
  getAdminStats, getWorksAddedThisMonth, getRecentWorksIncludingDraft,
} from '@/lib/queries'
import { domainTheme, currentAcademicYear, currentFiscalYear, excerpt } from '@/lib/theme'
import PageHead from '@/components/admin/PageHead'
import CountUp from '@/components/CountUp'
import { NewYearProvider, NewYearButton } from '@/components/admin/NewYearModal'
import { PickIndicatorProvider, PickIndicatorButton } from '@/components/admin/PickIndicatorModal'
import RecentWorksTable from '@/components/admin/RecentWorksTable'

/** แดชบอร์ดหลังบ้าน — แปลงมาจาก admin/index.php ของเว็บ PHP */

const STATUS_LABEL: Record<string, string> = {
  draft: 'ฉบับร่าง', in_progress: 'กำลังดำเนินการ', evaluated: 'ประเมินแล้ว',
}
const trimPct = (v: number) => v.toFixed(1).replace(/\.?0+$/, '')

export default async function AdminDashboard() {
  await requireAdmin()

  const [profile, stats, statsPub, domains, indicators, agreements, recent, newThisMonth] = await Promise.all([
    getProfile(), getAdminStats(true), getAdminStats(false),
    getDomains(), getIndicators(), getAgreements(),
    getRecentWorksIncludingDraft(6), getWorksAddedThisMonth(),
  ])

  const groups = domains.map((d) => ({
    code: Number(d.code),
    name: d.name,
    indicators: indicators.filter((i) => Number(i.domain_code) === Number(d.code))
      .map((i) => ({ id: Number(i.id), code: i.code, name: i.name })),
  }))
  const nextFiscalYear = Number(agreements[0]?.fiscal_year ?? currentFiscalYear() - 1) + 1
  const yearOpts = agreements.map((a) => ({ id: Number(a.id), fiscal_year: Number(a.fiscal_year) }))

  const w = stats.works_by_domain
  const totalW = Math.max(1, [...w.values()].reduce((a, b) => a + b, 0))
  const pct = new Map([1, 2, 3].map((c) => [c, Math.round(((w.get(c) ?? 0) / totalW) * 1000) / 10]))
  const stop1 = pct.get(1) ?? 0
  const stop2 = stop1 + (pct.get(2) ?? 0)

  const month = new Date().getMonth() + 1
  const semester = month >= 11 || month <= 3 ? 2 : 1
  const indTotal = Math.max(1, statsPub.indicator_total)
  const indFilled = statsPub.filled_total
  const completePct = Math.round((indFilled / indTotal) * 100)
  const R = 50, C = 2 * Math.PI * R
  const missing = statsPub.missing

  const donutBg = stats.total_works > 0
    ? `conic-gradient(var(--d1) 0 ${stop1}%, var(--d2) ${stop1}% ${stop2}%, var(--d3) ${stop2}% 100%)`
    : '#EEEDF7'

  const hoursStr = String(Number(stats.self_dev_hours))
  const nickname = profile?.nickname || profile?.full_name || 'ครู'

  const cards: [string, number, React.ReactNode, string, string, string, React.ReactNode][] = [
    ['ผลงานทั้งหมด', stats.total_works, null, '📚', 'bg-primary-soft', 'grad-text',
      newThisMonth
        ? <span className="chip chip-2 !text-[11px] !py-1">▲ +{newThisMonth} เดือนนี้</span>
        : <span className="text-[12px] text-ink-muted">ชิ้นงานในแฟ้ม</span>],
    ['ตัวชี้วัดที่มีผลงาน', indFilled,
      <span key="s" className="text-[15px] font-bold text-ink-faint">/{statsPub.indicator_total}</span>,
      '🎯', 'bg-mint-soft', 'bg-gradient-to-br from-mint to-sky bg-clip-text text-transparent',
      missing.length
        ? <span className="chip chip-accent !text-[11px] !py-1">เหลือ {missing.length}</span>
        : <span className="chip chip-2 !text-[11px] !py-1">ครบแล้ว 🎉</span>],
    [`ชม.พัฒนาตนเอง ${stats.fiscal_year}`, Number(hoursStr), null, '⏱️', 'bg-sky-soft',
      'bg-gradient-to-br from-sky to-[#1D4ED8] bg-clip-text text-transparent',
      <span key="h" className="text-[12px] text-ink-muted">ชั่วโมง</span>],
    ['รางวัล', stats.awards, null, '🏆', 'bg-sunny-soft',
      'bg-gradient-to-br from-coral to-[#2F6FDB] bg-clip-text text-transparent',
      <span key="a" className="text-[12px] text-ink-muted">รายการ</span>],
  ]

  return (
    <PickIndicatorProvider groups={groups}>
    <NewYearProvider nextYear={nextFiscalYear} years={yearOpts}>
      <PageHead
        title={`สวัสดีค่ะ ${nickname} 🌸`}
        sub={`ปีการศึกษา ${currentAcademicYear()} ภาคเรียนที่ ${semester}`}
        actions={<PickIndicatorButton className="btn btn-primary text-[12.5px]">+ เพิ่มผลงานใหม่</PickIndicatorButton>}
      />

      {/* ================= แถบต้อนรับ ================= */}
      <section className="mt-5 relative overflow-hidden rounded-[2rem] grad-hero text-white shadow-glow">
        <div className="absolute inset-0 dots opacity-25" />
        <div className="absolute -right-16 -top-24 w-72 h-72 rounded-full bg-white/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-24 w-56 h-56 rounded-full bg-white/10 blur-3xl pointer-events-none" />

        <div className="relative px-6 md:px-8 py-6 md:py-7 flex flex-col md:flex-row md:items-center gap-6">
          <div className="min-w-0 flex-1">
            <span className="chip chip-glass">✨ ปีการศึกษา {currentAcademicYear()} · ภาคเรียนที่ {semester}</span>
            <h2 className="mt-3 text-[24px] md:text-[30px] font-extrabold leading-tight">
              ยินดีต้อนรับกลับมา, {nickname} 👋
            </h2>
            <p className="mt-1.5 text-[13.5px] text-white/90 leading-relaxed">
              แฟ้มผลงานมี <b>{stats.total_works.toLocaleString('th-TH')}</b> ผลงาน
              {' '}· ตัวชี้วัดครบ <b>{indFilled}/{statsPub.indicator_total}</b>
              {newThisMonth > 0 && <> · เดือนนี้เพิ่มแล้ว <b>{newThisMonth}</b> ชิ้น 🔥</>}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <PickIndicatorButton className="btn btn-white btn-sm !text-[12.5px]">+ เพิ่มผลงานใหม่</PickIndicatorButton>
              <Link href="/admin/pa" className="btn btn-sm !text-[12.5px] bg-white/20 text-white ring-1 ring-inset ring-white/45 hover:bg-white/30 hover:-translate-y-0.5">📋 จัดการข้อตกลง PA</Link>
              <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-sm !text-[12.5px] bg-white/20 text-white ring-1 ring-inset ring-white/45 hover:bg-white/30 hover:-translate-y-0.5">👁️ ดูหน้าเว็บ</a>
            </div>
          </div>

          {/* วงแหวนความครบถ้วน */}
          <div className="shrink-0 flex items-center gap-4 md:gap-5 bg-white/15 rounded-[1.6rem] px-5 py-4 ring-1 ring-inset ring-white/30 self-start md:self-auto">
            <div className="relative w-[92px] h-[92px] shrink-0" role="img" aria-label={`ความครบถ้วนของแฟ้ม ${completePct}%`}>
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="13" />
                <circle cx="60" cy="60" r={R} fill="none" stroke="#fff" strokeWidth="13" strokeLinecap="round"
                  strokeDasharray={C.toFixed(1)} strokeDashoffset={(C * (1 - completePct / 100)).toFixed(1)}
                  style={{ transition: 'stroke-dashoffset 1.2s var(--ease-pop)' }} />
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <span className="text-[20px] font-extrabold leading-none"><CountUp to={completePct} />%</span>
              </div>
            </div>
            <div className="leading-tight">
              <p className="text-[11px] uppercase tracking-[.14em] font-semibold text-white/80">ความครบถ้วน</p>
              <p className="text-[15px] font-extrabold mt-1">{indFilled} / {statsPub.indicator_total} ตัวชี้วัด</p>
              <p className="text-[11.5px] text-white/85 mt-0.5">
                {missing.length ? `ยังขาดอีก ${missing.length} ตัวชี้วัด` : 'ครบทุกตัวชี้วัดแล้ว 🎉'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= การ์ดสถิติ ================= */}
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {cards.map(([label, num, suffix, icon, bg, gradCls, extra], i) => (
          <div key={label} className="card-pop pop-in rounded-[1.6rem] px-5 py-4" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex justify-between items-start gap-2">
              <span className="text-[12px] font-semibold text-ink-muted leading-snug pt-1">{label}</span>
              <span className={`w-11 h-11 rounded-2xl ${bg} grid place-items-center text-xl shrink-0 wiggle`}>{icon}</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
              <span className={`stat-num ${gradCls}`}><CountUp to={num} /></span>{suffix}
            </div>
            <div className="mt-2 min-h-[22px] flex items-center">{extra}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid lg:grid-cols-[1fr_1.15fr_.85fr] gap-3.5">

        {/* ================= โดนัทผลงานแยกด้าน ================= */}
        <section className="bg-white rounded-[1.6rem] p-6 shadow-soft border border-[color:var(--border)]">
          <h2 className="font-bold text-[16px]">🍩 ผลงานแยกตามด้าน</h2>
          <p className="text-[12px] text-ink-muted mt-0.5">สัดส่วนผลงานทั้งหมดใน 3 ด้าน วPA</p>

          <div className="flex justify-center mt-5">
            <div className="relative w-[172px] h-[172px] rounded-full grid place-items-center shadow-soft"
              style={{ background: donutBg }} role="img" aria-label="กราฟโดนัทผลงานแยกตามด้าน">
              <div className="w-[112px] h-[112px] rounded-full bg-white grid place-content-center text-center shadow-[inset_0_2px_10px_rgba(18,18,43,.06)]">
                <span className="text-[26px] font-extrabold leading-none grad-text"><CountUp to={stats.total_works} /></span>
                <span className="text-[10.5px] text-ink-muted mt-1">ผลงานรวม</span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            {domains.map((d) => {
              const c = d.code, t = domainTheme(c)
              return (
                <div key={d.id} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12px]" style={{ background: t.soft }}>
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: t.solid }} />
                  <span className="truncate font-semibold" style={{ color: t.deep }}>ด้านที่ {c} {d.name.slice(5, 27)}</span>
                  <b className="ml-auto whitespace-nowrap text-ink">{w.get(c) ?? 0} <span className="text-ink-muted font-medium">· {pct.get(c)}%</span></b>
                </div>
              )
            })}
          </div>
        </section>

        {/* ================= ความครบถ้วน 15 ตัวชี้วัด ================= */}
        <section className="bg-white rounded-[1.6rem] p-6 shadow-soft border border-[color:var(--border)]">
          <div className="flex justify-between items-start gap-3 flex-wrap">
            <div>
              <h2 className="font-bold text-[16px]">🎯 ความครบถ้วน {statsPub.indicator_total} ตัวชี้วัด</h2>
              <p className="text-[12px] text-ink-muted mt-0.5">ตัวชี้วัดที่มีผลงานเผยแพร่แล้ว แยกตามด้าน</p>
            </div>
            <span className={`chip ${missing.length ? 'chip-accent' : 'chip-2'}`}>
              {missing.length ? `ขาด ${missing.length}` : 'ครบ ✓'}
            </span>
          </div>

          <div className="mt-5 flex flex-col gap-4">
            {domains.map((d) => {
              const c = d.code, t = domainTheme(c)
              const f = statsPub.filled.get(c) ?? 0
              const tot = statsPub.total_per_domain.get(c) ?? 0
              const p = tot ? Math.round((f / tot) * 100) : 0
              return (
                <div key={d.id}>
                  <div className="flex justify-between items-center gap-2 text-[12px] mb-1.5">
                    <span className="flex items-center gap-1.5 font-bold min-w-0">
                      <span className="w-6 h-6 rounded-lg grid place-items-center text-[12px] shrink-0" style={{ background: t.soft }}>{d.icon}</span>
                      <span className="truncate">ด้านที่ {c}</span>
                    </span>
                    <span className="text-ink-muted whitespace-nowrap">
                      <b className="text-ink">{f}/{tot}</b> ตัวชี้วัด · {statsPub.works_by_domain.get(c) ?? 0} ผลงาน
                    </span>
                  </div>
                  <div className="bar"><span style={{ width: `${p}%`, background: t.grad }} /></div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {indicators.filter((ind) => Number(ind.domain_code) === c).map((ind) => {
                      const has = !missing.includes(ind.code)
                      return (
                        <Link key={ind.id} href={`/admin/indicator/${ind.id}`} title={`${ind.code} ${ind.name}`}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition hover:-translate-y-0.5 ${
                            has ? '' : 'border border-dashed border-[color:var(--border)] text-ink-faint bg-white hover:border-primary-line'}`}
                          style={has ? { background: t.soft, color: t.deep } : undefined}>
                          {has ? '✓' : '○'} {ind.code}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {missing.length > 0 ? (
            <p className="mt-4 rounded-2xl bg-sunny-soft px-3.5 py-2.5 text-[12px] text-sunny-deep leading-relaxed">
              💡 แนะนำ: เพิ่มผลงานตัวชี้วัด{' '}
              {indicators.filter((i) => missing.includes(i.code))
                .map((i) => <b key={i.id}>{i.code} {i.name.slice(0, 22)}</b>)
                .reduce<React.ReactNode[]>((acc, el, idx) => idx === 0 ? [el] : [...acc, ', ', el], [])}
              {' '}เพื่อให้แฟ้มครบ {statsPub.indicator_total} ตัวชี้วัด
            </p>
          ) : (
            <p className="mt-4 rounded-2xl bg-mint-soft px-3.5 py-2.5 text-[12px] text-mint-deep">🎉 เยี่ยมมาก! แฟ้มผลงานมีครบทั้ง {statsPub.indicator_total} ตัวชี้วัดแล้ว</p>
          )}
        </section>

        {/* ================= PA รายปี ================= */}
        <section className="bg-white rounded-[1.6rem] p-6 shadow-soft border border-[color:var(--border)]">
          <div className="flex justify-between items-center gap-2">
            <div>
              <h2 className="font-bold text-[16px]">📋 ข้อตกลง PA รายปี</h2>
              <p className="text-[12px] text-ink-muted mt-0.5">แยกข้อมูลตามปีงบประมาณ</p>
            </div>
            <Link href="/admin/pa" className="chip chip-primary hover:-translate-y-0.5 transition">จัดการ →</Link>
          </div>

          {agreements.length === 0 && (
            <div className="mt-5 text-center py-6">
              <div className="text-5xl float">📋</div>
              <p className="mt-2 text-[12.5px] text-ink-muted">ยังไม่มีข้อตกลง PA — เริ่มสร้างปีงบประมาณแรกได้เลย</p>
            </div>
          )}

          <div className="mt-3 flex flex-col gap-2.5">
            {agreements.map((a, i) => (
              <Link key={a.id} href={`/admin/pa?id=${a.id}`}
                className={`card-pop block rounded-[1.3rem] px-4 py-3 ${i === 0 ? '!border-primary-line' : ''}`}
                style={i === 0 ? { background: 'var(--grad-soft)' } : undefined}>
                <div className="flex justify-between items-center gap-2">
                  <b className="text-[13.5px] flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-xl grid place-items-center text-[13px] ${i === 0 ? 'grad-bg text-white shadow-glow' : 'bg-primary-soft'}`}>📅</span>
                    ปีงบประมาณ {a.fiscal_year}
                  </b>
                  {a.evaluation_score !== null ? (
                    <span className="chip chip-2">ผ่าน {trimPct(Number(a.evaluation_score))}%</span>
                  ) : (
                    <span className={`chip ${i === 0 ? 'chip-grad' : 'chip-1'}`}>{i === 0 ? 'ล่าสุด · ' : ''}รอบ {a.round}</span>
                  )}
                </div>
                <p className="text-[11.5px] text-ink-muted mt-1.5 pl-10">
                  {STATUS_LABEL[a.status] ?? ''} · ตัวชี้วัด {a.detail_count}/15 · PDF {a.pdf_ref ? '✓' : '—'}
                </p>
              </Link>
            ))}
          </div>

          <NewYearButton className="w-full mt-3 min-h-[46px] border-2 border-dashed border-primary-line rounded-[1.3rem] py-2.5 text-[12.5px] font-bold text-primary-deep bg-white hover:bg-primary-soft hover:border-primary transition">
            + สร้างปีงบประมาณใหม่
          </NewYearButton>
        </section>
      </div>

      {/* ================= ผลงานล่าสุด ================= */}
      <section className="mt-4 bg-white rounded-[1.6rem] p-6 shadow-soft border border-[color:var(--border)]">
        {recent.length === 0 ? (
          <>
            <div className="flex justify-between items-center gap-3 flex-wrap">
              <div>
                <h2 className="font-bold text-[16px]">🗂️ ผลงานล่าสุด</h2>
                <p className="text-[12px] text-ink-muted mt-0.5">6 รายการล่าสุด รวมฉบับร่าง</p>
              </div>
            </div>
            <div className="text-center py-10">
              <div className="text-5xl float">📚</div>
              <p className="mt-3 text-[13px] text-ink-muted">ยังไม่มีผลงานในแฟ้ม — เริ่มเพิ่มผลงานชิ้นแรกกันเลย</p>
              <PickIndicatorButton className="btn btn-primary btn-sm mt-4">+ เพิ่มผลงานใหม่</PickIndicatorButton>
            </div>
          </>
        ) : (
          <RecentWorksTable rows={recent.map((r) => {
            const t = domainTheme(r.domain_code)
            return {
              id: Number(r.id), title: excerpt(r.title, 46),
              indicator_id: Number(r.indicator_id),
              indicator_code: r.indicator_code ?? '',
              indicator_name: (r.indicator_name ?? '').slice(0, 18),
              semester: Number(r.semester), academic_year: Number(r.academic_year),
              status: r.status, view_count: Number(r.view_count ?? 0),
              chipBg: t.soft, chipText: t.deep,
            }
          })} />
        )}
      </section>
    </NewYearProvider>
    </PickIndicatorProvider>
  )
}
