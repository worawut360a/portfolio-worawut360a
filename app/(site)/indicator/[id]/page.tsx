import Link from 'next/link'
import AdminOnly from '@/components/AdminOnly'
import { notFound } from 'next/navigation'
import {
  getIndicator, getIndicators, getIndicatorNeighbors,
  getAcademicYears, getWorkPage,
} from '@/lib/queries'
import { imageUrl, IMG } from '@/lib/media'
import { domainTheme } from '@/lib/theme'
import IndicatorWorks, { type ApiWork } from '@/components/IndicatorWorks'

/**
 * หน้ารายละเอียดตัวชี้วัด 1 ตัว
 * แปลงมาจาก indicator.php ของเว็บ PHP ให้โครงสร้างและข้อความตรงกัน
 *   HERO สีประจำด้าน → ผลงาน (ค้นหา/กรอง/เรียง/แบ่งหน้า) → ตัวชี้วัดก่อนหน้า–ถัดไป
 */

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ind = await getIndicator(Number(id))
  return {
    title: ind ? `ตัวชี้วัด ${ind.code} ${ind.name}` : 'ไม่พบตัวชี้วัด',
    description: ind?.description,
  }
}

/** สร้างหน้าตัวชี้วัดทั้ง 15 ตัวไว้ล่วงหน้าตอน build */
export async function generateStaticParams() {
  const list = await getIndicators()
  return list.map((i) => ({ id: String(i.id) }))
}

export default async function IndicatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const indId = Number(id)
  const ind = await getIndicator(indId)
  if (!ind) notFound()

  const dc = Number(ind.domain_code)
  const theme = domainTheme(dc)

  const [years, result, neighbors] = await Promise.all([
    getAcademicYears(),
    getWorkPage({ indicatorId: indId, perPage: 9 }),
    getIndicatorNeighbors(indId),
  ])

  const initialRows: ApiWork[] = result.rows.map((w) => ({
    id: w.id, title: w.title, url: `/work/${w.slug}`,
    cover_url: imageUrl({ source: w.cover_source, ref: w.cover_ref }, IMG.card),
    indicator_code: w.indicator_code ?? '', indicator_name: w.indicator_name ?? '',
    domain_code: Number(w.domain_code), semester: w.semester, academic_year: w.academic_year,
    view_count: w.view_count, is_featured: w.is_featured,
    image_count: w.image_count, file_count: w.file_count,
  }))

  return (
    <main>
      {/* ================= Hero ของตัวชี้วัด (สีประจำด้าน) ================= */}
      <section className="relative overflow-hidden text-white" style={{ background: theme.grad }}>
        <div className="absolute inset-0 dots opacity-20" />
        <div className="blob w-[320px] h-[320px] !opacity-40 bg-white -right-20 -bottom-32" />
        <span className="absolute -right-4 -top-6 text-[180px] md:text-[240px] font-extrabold leading-none text-white/10 select-none pointer-events-none hidden sm:block">{ind.code}</span>

        <div className="relative max-w-[1240px] mx-auto px-4 md:px-10 pt-8 md:pt-12 pb-12 md:pb-16">
          <nav className="text-[12px] text-white/80 flex flex-wrap items-center gap-1.5" aria-label="เส้นทาง">
            <Link href="/" className="hover:underline hover:text-white">หน้าแรก</Link> <span aria-hidden="true">/</span>
            <Link href={`/pa#d${dc}`} className="hover:underline hover:text-white">ข้อตกลง PA · ด้านที่ {dc}</Link> <span aria-hidden="true">/</span>
            <b className="text-white">ตัวชี้วัด {ind.code}</b>
          </nav>

          <div className="flex flex-wrap items-start gap-4 md:gap-6 mt-6">
            <span className="w-16 h-16 md:w-20 md:h-20 rounded-[1.4rem] bg-white/25 backdrop-blur grid place-items-center text-[30px] md:text-[38px] shrink-0 wiggle">
              {theme.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip chip-glass !text-ink">{theme.icon} ด้านที่ {dc} · {ind.domain_name}</span>
                <span className="chip bg-white/20 text-white border border-white/40">{result.total} ผลงาน</span>
              </div>
              <h1 className="mt-3 text-[26px] md:text-[40px] font-extrabold leading-[1.15] tracking-tight">
                <span className="inline-block bg-white rounded-2xl px-3 py-0.5 mr-2 align-middle text-[22px] md:text-[32px] shadow-soft"
                  style={{ color: theme.deep }}>{ind.code}</span>
                {' '}{ind.name}
              </h1>
              {ind.description && (
                <p className="mt-3 text-[13.5px] md:text-[15px] leading-relaxed text-white/90 max-w-3xl">{ind.description}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1240px] mx-auto px-4 md:px-10 pb-10">

        {/* ================= ผลงาน / หลักฐาน ================= */}
        <section className="pt-8 md:pt-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div>
              <span className="chip chip-accent">📚 หลักฐาน</span>
              <h2 className="mt-3 text-[26px] md:text-[34px] font-extrabold leading-tight">ผลงานของ<span className="grad-text">ตัวชี้วัดนี้</span></h2>
            </div>
            <p className="text-[13.5px] text-ink-muted hidden md:block">พบ <b className="text-primary-deep">{result.total}</b> ผลงาน</p>
          </div>

          <IndicatorWorks indicatorId={indId} years={years}
            initial={{ rows: initialRows, total: result.total, page: result.page, last_page: result.last_page }} />
        </section>

        {/* ================= ตัวชี้วัดก่อนหน้า / ถัดไป ================= */}
        <nav className="mt-2 grid md:grid-cols-2 gap-4" aria-label="ตัวชี้วัดอื่น">
          {([['prev', '←', 'ตัวชี้วัดก่อนหน้า'], ['next', '→', 'ตัวชี้วัดถัดไป']] as const).map(([key, arrow, label]) => {
            const nb = neighbors[key]
            if (!nb) return <span key={key} />
            const nt = domainTheme(nb.domain_code)
            const right = key === 'next'
            return (
              <Link key={key} href={`/indicator/${nb.id}`}
                className={`card-pop group flex items-center gap-4 rounded-[1.6rem] px-5 py-4 min-h-[76px] ${right ? 'md:flex-row-reverse md:text-right' : ''}`}>
                <span className={`w-11 h-11 shrink-0 rounded-full grid place-items-center font-extrabold text-white shadow-soft transition-transform ${right ? 'group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`}
                  style={{ background: nt.grad }} aria-hidden="true">{arrow}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10.5px] font-bold tracking-[.12em] uppercase text-ink-muted">{nt.icon} {label}</span>
                  <span className="block text-[14px] font-bold leading-snug line-2 mt-0.5 group-hover:text-primary-deep transition-colors">
                    <span className="inline-block rounded-md px-1.5 text-[12px] font-extrabold text-white align-middle mr-1"
                      style={{ background: nt.solid }}>{nb.code}</span>{nb.name}
                  </span>
                </span>
              </Link>
            )
          })}
        </nav>

        <div className="pt-8 pb-6 flex flex-wrap justify-center gap-3">
          <Link href={`/pa#d${dc}`} className="btn btn-ghost text-[13px]">← กลับไปยังตัวชี้วัดทั้ง 15 ตัว</Link>
          <AdminOnly>
            <Link href={`/admin/indicator/${id}`} className="btn btn-primary text-[13px]">⚙️ จัดการผลงานของตัวชี้วัดนี้</Link>
          </AdminOnly>
        </div>
      </div>
    </main>
  )
}
