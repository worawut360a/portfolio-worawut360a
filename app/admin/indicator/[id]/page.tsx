import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import {
  getIndicator, getIndicators, getDomains, getIndicatorNeighbors,
  getAcademicYears, getAgreements, getPaDetails,
} from '@/lib/queries'
import { domainTheme, currentAcademicYear } from '@/lib/theme'
import PageHead from '@/components/admin/PageHead'
import { WorkModalProvider, NewWorkButton } from '@/components/admin/WorkModal'
import AdminWorkTable from '@/components/admin/AdminWorkTable'

/** จัดการ “ผลงาน” ของตัวชี้วัด 1 ตัว — แปลงจาก admin/indicator.php */
export default async function IndicatorAdmin({
  params, searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ edit?: string; new?: string }>
}) {
  await requireAdmin()   // ต้องตรวจในทุกหน้า ไม่ใช่แค่ layout — Next render layout กับ page พร้อมกัน

  const { id: idRaw } = await params
  const sp = await searchParams
  const id = Number(idRaw) || 0

  const ind = await getIndicator(id)
  if (!ind) notFound()

  const dc = Number(ind.domain_code)
  const theme = domainTheme(dc)

  const [indicators, domains, neighbors, years, agreements] = await Promise.all([
    getIndicators(), getDomains(), getIndicatorNeighbors(id),
    getAcademicYears(), getAgreements(),
  ])

  const agreement = agreements[0] ?? null
  const paDetail = agreement
    ? (await getPaDetails(Number(agreement.id))).find((d) => Number(d.indicator_id) === id) ?? null
    : null

  const groups = domains.map((d) => ({
    code: Number(d.code),
    name: d.name,
    indicators: indicators.filter((i) => Number(i.domain_code) === Number(d.code))
      .map((i) => ({ id: Number(i.id), code: i.code, name: i.name })),
  }))

  const yearList = years.length ? years : [currentAcademicYear()]

  return (
    <WorkModalProvider indicatorId={id} indicatorLabel={`${ind.code} ${ind.name}`} groups={groups}
      openNew={sp.new === '1'} openEdit={Number(sp.edit) || undefined}>
      <PageHead
        title={`ตัวชี้วัด ${ind.code} · ${ind.name}`}
        sub={`ด้านที่ ${dc} ${ind.domain_name} — จัดการผลงานและหลักฐานของตัวชี้วัดนี้`}
        actions={<NewWorkButton className="btn btn-primary text-[12.5px]">+ เพิ่มผลงานใหม่</NewWorkButton>}
      />

      {/* แถบนำทางกลับ + ตัวชี้วัดก่อนหน้า/ถัดไป */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Link href="/admin/pa" className="btn btn-ghost btn-sm">← กลับไปจัดการข้อตกลง PA</Link>
        <a href={`/indicator/${id}`} target="_blank" rel="noreferrer" className="btn btn-white btn-sm">👁️ ดูหน้าเว็บของตัวชี้วัดนี้</a>

        <span className="ml-auto flex gap-2">
          {neighbors.prev && (
            <Link href={`/admin/indicator/${neighbors.prev.id}`} className="btn btn-white btn-sm"
              title={neighbors.prev.name}>← {neighbors.prev.code}</Link>
          )}
          {neighbors.next && (
            <Link href={`/admin/indicator/${neighbors.next.id}`} className="btn btn-white btn-sm"
              title={neighbors.next.name}>{neighbors.next.code} →</Link>
          )}
        </span>
      </div>

      {/* หัวตัวชี้วัด + ข้อตกลง PA ของตัวชี้วัดนี้ (ปีล่าสุด) */}
      <section className="mt-4 relative overflow-hidden rounded-[1.9rem] text-white shadow-lift" style={{ background: theme.grad }}>
        <div className="absolute inset-0 dots opacity-25 pointer-events-none" />
        <div className="absolute -right-10 -top-14 w-[220px] h-[220px] rounded-full bg-white/15 blur-2xl pointer-events-none" />

        <div className="relative p-5 md:p-7">
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            <span className="w-14 h-14 rounded-2xl bg-white/20 border border-white/40 grid place-items-center text-3xl shrink-0 float-slow">{theme.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip chip-glass !text-[11px]">ด้านที่ {dc} · {ind.domain_name}</span>
                <span className="chip bg-white text-[11px] font-extrabold" style={{ color: theme.deep }}>{ind.code}</span>
              </div>
              <h2 className="mt-2 text-[20px] md:text-[26px] font-extrabold leading-tight">{ind.name}</h2>
              <p className="mt-1 text-[12.5px] text-white/85">
                📋 ข้อตกลงในการพัฒนางาน{agreement ? ` · ปีงบประมาณ ${agreement.fiscal_year}` : ''}
              </p>
            </div>
            {agreement && (
              <Link href={`/admin/pa?id=${agreement.id}`} className="btn btn-white btn-sm self-start shrink-0">แก้ไขข้อตกลง →</Link>
            )}
          </div>

          {paDetail ? (
            <div className="mt-5 grid md:grid-cols-3 gap-3">
              <div className="md:col-span-3 bg-white/90 rounded-2xl px-4 py-3.5 text-ink shadow-soft">
                <p className="text-[11px] font-extrabold" style={{ color: theme.deep }}>🎯 งานที่จะปฏิบัติ</p>
                <p className="mt-0.5 text-[13.5px] font-semibold leading-relaxed">{paDetail.task_description}</p>
              </div>
              <div className="bg-white/90 rounded-2xl px-4 py-3.5 text-ink shadow-soft">
                <p className="text-[11px] font-extrabold text-mint-deep">📊 เชิงปริมาณ</p>
                <p className="mt-0.5 text-[12.5px] text-ink-soft leading-relaxed">{paDetail.expected_quantity || '—'}</p>
              </div>
              <div className="md:col-span-2 bg-white/90 rounded-2xl px-4 py-3.5 text-ink shadow-soft">
                <p className="text-[11px] font-extrabold text-sky-deep">🌟 เชิงคุณภาพ</p>
                <p className="mt-0.5 text-[12.5px] text-ink-soft leading-relaxed">{paDetail.expected_quality || '—'}</p>
              </div>
            </div>
          ) : (
            <div className="mt-5 bg-white/90 rounded-2xl px-4 py-3.5 text-ink shadow-soft flex flex-wrap items-center gap-2 text-[12.5px]">
              <span>⚠️ ยังไม่ได้กรอกข้อตกลงของตัวชี้วัดนี้{agreement ? ` ในปีงบประมาณ ${agreement.fiscal_year}` : ''}</span>
              {agreement && (
                <Link href={`/admin/pa?id=${agreement.id}`} className="font-bold text-primary-deep underline underline-offset-2">
                  กรอกที่หน้าจัดการ PA →
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      <AdminWorkTable indicatorId={id} years={yearList} />
    </WorkModalProvider>
  )
}
