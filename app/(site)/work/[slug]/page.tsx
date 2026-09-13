import Link from 'next/link'
import AdminOnly from '@/components/AdminOnly'
import { notFound } from 'next/navigation'
import {
  getWorkBySlug, getWorkImages, getWorkFiles, getWorks,
  getRelatedWorks, getWorkNeighbors, getIndicatorWorkTotal,
} from '@/lib/queries'
import { imageUrl, fileUrl, IMG } from '@/lib/media'
import { domainTheme, thaiDate, fileIcon, humanSize, excerpt, youtubeId } from '@/lib/theme'
import WorkGallery from '@/components/WorkGallery'
import ShareBar from '@/components/ShareBar'

/**
 * หน้ารายละเอียดผลงาน — แปลงมาจาก work.php ของเว็บ PHP ให้โครงสร้างและข้อความตรงกัน
 *   HERO ไล่สีตามด้าน → แกลเลอรี → เนื้อหา → แถบข้าง (ข้อมูล/ไฟล์แนบ/เกี่ยวข้อง/ก่อนหน้า-ถัดไป)
 */

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const w = await getWorkBySlug(decodeURIComponent(slug))
  return {
    title: w?.title ?? 'ไม่พบผลงาน',
    description: excerpt(w?.summary || w?.content, 160),
  }
}

/** สร้างหน้าผลงานทุกชิ้นไว้ล่วงหน้าตอน build */
export async function generateStaticParams() {
  const works = await getWorks()
  return works.map((w) => ({ slug: w.slug }))
}

export default async function WorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const work = await getWorkBySlug(decodeURIComponent(slug))
  if (!work) notFound()

  const [images, files, related, neighbors, indicatorTotal] = await Promise.all([
    getWorkImages(work.id), getWorkFiles(work.id),
    getRelatedWorks(work.indicator_id, work.id, 3),
    getWorkNeighbors(work.indicator_id, work.work_date, work.id),
    getIndicatorWorkTotal(work.indicator_id),
  ])

  const theme = domainTheme(work.domain_code)
  const domain = Number(work.domain_code)
  const ytId = youtubeId(work.video_url)
  const tags = work.tags ? work.tags.split(',').map((t) => t.trim()).filter(Boolean) : []
  const galleryImages = images.map((im) => ({ id: im.id, source: im.source, ref: im.ref, caption: im.caption }))

  return (
    <main>
      {/* ================= HERO (ไล่สีตามด้าน) ================= */}
      <section className="relative overflow-hidden text-white" style={{ background: theme.grad }}>
        <div className="absolute inset-0 dots opacity-20" />
        <div className="blob w-[360px] h-[360px] !opacity-40 bg-white -right-24 -top-16" />
        <div className="blob w-[240px] h-[240px] !opacity-25 bg-white -left-20 -bottom-28 hidden md:block" />
        <span className="absolute -right-2 -bottom-10 text-[220px] md:text-[300px] font-extrabold leading-none text-white/10 select-none pointer-events-none" aria-hidden="true">{domain}</span>

        <div className="relative max-w-[1240px] mx-auto px-4 md:px-10 pt-8 md:pt-12 pb-10 md:pb-14">
          {/* breadcrumb chips */}
          <nav className="flex flex-wrap items-center gap-1.5 text-[11.5px]" aria-label="breadcrumb">
            <Link href="/" className="chip chip-glass !text-[11px] hover:!bg-white transition">🏠 หน้าแรก</Link>
            <span className="text-white/70" aria-hidden="true">›</span>
            <Link href={`/pa#d${domain}`} className="chip chip-glass !text-[11px] hover:!bg-white transition">ข้อตกลง PA · ด้านที่ {domain}</Link>
            <span className="text-white/70" aria-hidden="true">›</span>
            <Link href={`/indicator/${work.indicator_id}`} className="chip chip-glass !text-[11px] hover:!bg-white transition">ตัวชี้วัด {work.indicator_code}</Link>
            <span className="text-white/70 hidden sm:inline" aria-hidden="true">›</span>
            <b className="hidden sm:inline text-white/90 font-semibold truncate max-w-[260px]">{excerpt(work.title, 40)}</b>
          </nav>

          <div className="mt-6 grid lg:grid-cols-[1fr_auto] gap-6 items-end">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <span className="chip bg-white/20 backdrop-blur text-white border border-white/30">
                  {theme.icon} ด้านที่ {domain} · ตัวชี้วัด {work.indicator_code}
                </span>
                {work.is_featured === 1 && <span className="chip chip-accent">⭐ ผลงานเด่น</span>}
                <span className="chip chip-glass">📅 ปีการศึกษา {work.academic_year} · ภาคเรียนที่ {work.semester}</span>
              </div>

              <p className="mt-5 text-[12px] font-bold tracking-[.14em] uppercase text-white/85">{work.indicator_name}</p>
              <h1 className="mt-1.5 text-[26px] md:text-[38px] font-extrabold leading-tight tracking-tight drop-shadow-sm">{work.title}</h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] font-medium text-white/90">
                <span>🗓️ เผยแพร่ {thaiDate(work.work_date, false)}</span>
                <span>👁️ {work.view_count.toLocaleString('th-TH')} ครั้ง</span>
                {images.length > 0 && <span>🖼️ {images.length} รูป</span>}
                {files.length > 0 && <span>📎 {files.length} ไฟล์</span>}
              </div>
            </div>

            <ShareBar />
          </div>
        </div>
      </section>

      {/* ================= เนื้อหา ================= */}
      <section className="max-w-[1240px] mx-auto px-4 md:px-10 -mt-6 md:-mt-8 pb-12 relative z-10">
        <div className="grid lg:grid-cols-[1.65fr_.85fr] gap-6 lg:gap-7 items-start">

          {/* ================= คอลัมน์ซ้าย ================= */}
          {/* min-w-0 สำคัญมาก: กันไม่ให้ความกว้างธรรมชาติของรูปดันคอลัมน์กริดจนล้นจอ */}
          <div className="min-w-0">
            {images.length > 0 ? (
              <WorkGallery images={galleryImages} title={work.title} />
            ) : (
              <div className="w-full rounded-[2rem] overflow-hidden shadow-soft border border-[color:var(--border)] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/media/placeholder.svg" alt="ยังไม่มีรูปภาพประกอบ" className="w-full h-auto" width={800} height={500} />
              </div>
            )}

            {/* เนื้อหา */}
            <article className="mt-7 card-soft rounded-[2rem] p-6 md:p-9">
              <div className="flex items-center gap-2.5 mb-5">
                <span className="w-10 h-10 rounded-2xl grid place-items-center text-lg text-white shrink-0" style={{ background: theme.grad }}>📖</span>
                <h2 className="font-extrabold text-[18px] md:text-[20px] leading-tight">รายละเอียด<span className="grad-text">ผลงาน</span></h2>
              </div>

              {work.summary && (
                <p className="text-[14.5px] leading-loose text-ink-soft font-medium mb-6 pb-6 border-b border-dashed border-[color:var(--border)] relative pl-4">
                  <span className="absolute left-0 top-1 bottom-7 w-1 rounded-full grad-bg" aria-hidden="true" />
                  {work.summary}
                </p>
              )}

              <div className="rich" dangerouslySetInnerHTML={{
                __html: work.content || '<p class="text-ink-muted">ยังไม่มีรายละเอียดเนื้อหา</p>',
              }} />

              {ytId && (
                <div className="mt-7">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="chip chip-1">▶️ วิดีโอประกอบ</span>
                  </div>
                  <div className="rounded-[1.6rem] overflow-hidden aspect-video bg-ink shadow-soft">
                    <iframe className="w-full h-full" src={`https://www.youtube-nocookie.com/embed/${ytId}`}
                      title={`วิดีโอประกอบผลงาน ${work.title}`} loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen />
                  </div>
                </div>
              )}

              {tags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-7 pt-5 border-t border-[color:var(--divider)]">
                  {tags.map((tag) => <span key={tag} className="chip chip-primary !text-[11px]">#{tag}</span>)}
                </div>
              )}
            </article>
          </div>

          {/* ================= คอลัมน์ขวา ================= */}
          <aside className="min-w-0 flex flex-col gap-4">

            {/* ข้อมูลผลงาน */}
            <div className="card-soft rounded-[1.8rem] p-5 md:p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-9 h-9 rounded-xl grid place-items-center text-base shrink-0" style={{ background: theme.soft }}>📌</span>
                <h2 className="font-extrabold text-[15.5px]">ข้อมูลผลงาน</h2>
              </div>
              <dl className="flex flex-col divide-y divide-[color:var(--divider)] text-[12.5px]">
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-ink-muted shrink-0">ด้าน</dt>
                  <dd className="font-bold text-right" style={{ color: theme.deep }}>{theme.icon} ด้านที่ {domain}</dd>
                </div>
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-ink-muted shrink-0">ตัวชี้วัด</dt>
                  <dd className="font-bold text-right">{work.indicator_code} {(work.indicator_name ?? '').slice(0, 26)}</dd>
                </div>
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-ink-muted shrink-0">ปีการศึกษา</dt>
                  <dd className="font-bold text-right">{work.academic_year} · ภาคเรียนที่ {work.semester}</dd>
                </div>
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-ink-muted shrink-0">วันที่จัดทำ</dt>
                  <dd className="font-bold text-right">{thaiDate(work.work_date)}</dd>
                </div>
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-ink-muted shrink-0">รูปภาพ / ไฟล์</dt>
                  <dd className="font-bold text-right">{images.length} รูป · {files.length} ไฟล์</dd>
                </div>
              </dl>
            </div>

            {/* ไฟล์แนบ */}
            {files.length > 0 && (
              <div className="card-soft rounded-[1.8rem] p-5 md:p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="w-9 h-9 rounded-xl bg-sunny-soft grid place-items-center text-base shrink-0">📎</span>
                  <h2 className="font-extrabold text-[15.5px]">ไฟล์แนบ <span className="text-ink-muted font-semibold">({files.length})</span></h2>
                </div>
                <div className="flex flex-col gap-2.5">
                  {files.map((f) => (
                    <a key={f.id} href={fileUrl(f) ?? '#'} target="_blank" rel="noopener noreferrer"
                      className="group flex items-center gap-3 p-3 min-h-[44px] rounded-2xl border-2 border-[color:var(--border)] bg-white
                                 transition hover:border-primary-line hover:bg-primary-soft/40 hover:-translate-y-0.5">
                      <span className="w-11 h-11 rounded-xl bg-primary-soft grid place-items-center text-lg shrink-0 group-hover:scale-110 transition-transform">{fileIcon(f.mime_type)}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[12.5px] font-bold truncate group-hover:text-primary-deep transition-colors">{f.original_name}</span>
                        <span className="block text-[10.5px] text-ink-muted">
                          {f.source === 'drive' ? 'เปิดใน Google Drive' : humanSize(f.size_bytes)}
                        </span>
                      </span>
                      <span className="w-8 h-8 rounded-full grad-bg text-white grid place-items-center text-[12px] font-extrabold shrink-0 opacity-80 group-hover:opacity-100 transition" aria-hidden="true">⬇</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* ผลงานที่เกี่ยวข้อง */}
            {related.length > 0 && (
              <div className="card-soft rounded-[1.8rem] p-5 md:p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="w-9 h-9 rounded-xl bg-coral-soft grid place-items-center text-base shrink-0">💕</span>
                  <h2 className="font-extrabold text-[15.5px]">ผลงานที่เกี่ยวข้อง</h2>
                </div>
                <div className="flex flex-col gap-2">
                  {related.map((r) => {
                    const rt = domainTheme(r.domain_code)
                    return (
                      <Link key={r.id} href={`/work/${r.slug}`}
                        className="group flex gap-3 items-center p-2 -mx-2 rounded-2xl transition hover:bg-primary-soft/40">
                        <span className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-[color:var(--divider)]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imageUrl({ source: r.cover_source, ref: r.cover_ref }, IMG.thumb)} alt=""
                            width={128} height={128} loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[12.5px] font-bold leading-snug line-2 group-hover:text-primary-deep transition-colors">{r.title}</span>
                          <span className="mt-1 inline-flex items-center gap-1.5 text-[10.5px] font-bold" style={{ color: rt.deep }}>
                            <span className="w-2 h-2 rounded-full inline-block" style={{ background: rt.solid }} />
                            ตัวชี้วัด {r.indicator_code} · {r.semester}/{r.academic_year}
                          </span>
                        </span>
                        <span className="text-ink-faint group-hover:text-primary-deep group-hover:translate-x-1 transition-all" aria-hidden="true">→</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ================= ผลงานก่อนหน้า / ถัดไป ================= */}
            {(neighbors.prev || neighbors.next || indicatorTotal > 1) && (
              <nav className="flex flex-col gap-3" aria-label="ผลงานอื่นในตัวชี้วัดเดียวกัน">
                <div className="flex items-start gap-2.5 px-1">
                  <span className={`chip chip-${domain} shrink-0`}>ตัวชี้วัด {work.indicator_code}</span>
                  <p className="text-[12px] text-ink-muted leading-snug pt-1">{work.indicator_name}</p>
                </div>

                {neighbors.prev && (
                  <Link href={`/work/${neighbors.prev.slug}`}
                    className="card-pop group flex items-center gap-3.5 !rounded-[1.5rem] px-4 py-3.5 min-h-[44px]">
                    <span className="w-11 h-11 shrink-0 rounded-full bg-primary-soft text-primary-deep grid place-items-center text-lg
                                     font-extrabold transition group-hover:bg-[image:var(--grad)] group-hover:text-white group-hover:-translate-x-0.5" aria-hidden="true">←</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[10.5px] font-extrabold tracking-[.1em] uppercase text-primary-deep">ผลงานก่อนหน้า</span>
                      <span className="block text-[13px] font-bold leading-snug line-2 mt-0.5">{neighbors.prev.title}</span>
                      <span className="block text-[10.5px] text-ink-muted mt-0.5">📅 {thaiDate(neighbors.prev.work_date)}</span>
                    </span>
                  </Link>
                )}

                {neighbors.next && (
                  <Link href={`/work/${neighbors.next.slug}`}
                    className="card-pop group flex items-center gap-3.5 !rounded-[1.5rem] px-4 py-3.5 min-h-[44px]">
                    <span className="min-w-0 flex-1 text-right">
                      <span className="block text-[10.5px] font-extrabold tracking-[.1em] uppercase text-primary-deep">ผลงานถัดไป</span>
                      <span className="block text-[13px] font-bold leading-snug line-2 mt-0.5">{neighbors.next.title}</span>
                      <span className="block text-[10.5px] text-ink-muted mt-0.5">📅 {thaiDate(neighbors.next.work_date)}</span>
                    </span>
                    <span className="w-11 h-11 shrink-0 rounded-full bg-primary-soft text-primary-deep grid place-items-center text-lg
                                     font-extrabold transition group-hover:bg-[image:var(--grad)] group-hover:text-white group-hover:translate-x-0.5" aria-hidden="true">→</span>
                  </Link>
                )}

                <Link href={`/indicator/${work.indicator_id}`}
                  className="btn btn-ghost w-full text-[12.5px] !whitespace-normal !leading-snug text-center">
                  ดูผลงานทั้งหมดในตัวชี้วัด {work.indicator_code} ({indicatorTotal} ชิ้น)
                </Link>
              </nav>
            )}

            <AdminOnly>
              <Link href={`/admin/indicator/${work.indicator_id}?edit=${work.id}`} className="btn btn-ink w-full">
                ✏️ แก้ไขผลงานนี้
              </Link>
            </AdminOnly>
          </aside>
        </div>
      </section>
    </main>
  )
}
