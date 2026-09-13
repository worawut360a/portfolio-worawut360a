import Link from 'next/link'
import AdminOnly from '@/components/AdminOnly'
import WorkGallery, { type GalleryImage } from '@/components/WorkGallery'
import ShareBar from '@/components/ShareBar'
import { fileUrl } from '@/lib/media'
import { fileIcon, humanSize, youtubeId, excerpt } from '@/lib/theme'
import type { ItemFile } from '@/lib/types'

/**
 * โครงหน้ารายละเอียดของ "รางวัล" และ "การพัฒนาตนเอง"
 * แปลงมาจาก award.php / training.php ซึ่งใช้โครงเดียวกัน ต่างแค่ข้อความและช่องข้อมูล
 */

export interface NeighborLink { href: string; label: string; title: string; meta: string }

/**
 * โทนสีของหน้า — รางวัลใช้สีธีม ส่วนการพัฒนาตนเองใช้ชมพู/ด้าน 3 ตายตัว
 * (ตรงกับ award.php ที่ใช้ grad-hero และ training.php ที่ใช้ grad-pink)
 */
const TONE = {
  primary: {
    hero: 'grad-hero', dots: 'opacity-20', blob1: '!opacity-40', blob2: '!opacity-25',
    noteBg: 'bg-primary-soft/40', noteText: 'text-primary-deep',
    navBg: 'bg-primary-soft', navText: 'text-primary-deep', navHover: 'group-hover:bg-[image:var(--grad)]',
  },
  sky: {
    hero: 'grad-pink', dots: 'opacity-[.14]', blob1: '!opacity-25', blob2: '!opacity-20',
    noteBg: 'bg-sky-soft/50', noteText: 'text-sky-deep',
    navBg: 'bg-sky-soft', navText: 'text-sky-deep', navHover: 'group-hover:bg-sky',
  },
} as const

export interface ItemDetailProps {
  /* โทนสี */
  tone?: keyof typeof TONE
  /* HERO */
  watermark: string
  breadcrumb: { href: string; label: string }[]
  eyebrow: string
  title: string
  heroChips: React.ReactNode
  heroMeta: React.ReactNode
  /* เนื้อหา */
  bodyIcon: string
  bodyHeading: React.ReactNode
  emptyContentText: string
  summary: string
  content: string | null
  note: string
  videoUrl: string
  linkUrl: string
  linkLabel: string
  /* แถบข้าง */
  infoIconBg: string
  infoHeading: string
  info: [string, React.ReactNode][]
  extraAside?: React.ReactNode
  /** ปุ่มกลับท้ายแถบข้าง + ปุ่มลัดไปแก้ไขในหลังบ้าน (โชว์เฉพาะตอนครูล็อกอิน) */
  asideBackHref: string
  asideBackLabel: string
  editHref: string
  editLabel: string
  /* อื่น ๆ */
  images: GalleryImage[]
  files: ItemFile[]
  prev: NeighborLink | null
  next: NeighborLink | null
  footerHref: string
  footerLabel: string
}

export default function ItemDetail(p: ItemDetailProps) {
  const ytId = youtubeId(p.videoUrl)
  const t = TONE[p.tone ?? 'primary']

  return (
    <main>
      {/* ================= HERO ================= */}
      <section className={`relative overflow-hidden ${t.hero} text-white`}>
        <div className={`absolute inset-0 dots ${t.dots}`} />
        <div className={`blob w-[360px] h-[360px] ${t.blob1} bg-white -right-24 -top-16`} />
        <div className={`blob w-[240px] h-[240px] ${t.blob2} bg-white -left-20 -bottom-28 hidden md:block`} />
        <span className="absolute -right-2 -bottom-10 text-[200px] md:text-[280px] font-extrabold leading-none text-white/10 select-none pointer-events-none" aria-hidden="true">{p.watermark}</span>

        <div className="relative max-w-[1240px] mx-auto px-4 md:px-10 pt-8 md:pt-12 pb-10 md:pb-14">
          <nav className="flex flex-wrap items-center gap-1.5 text-[11.5px]" aria-label="breadcrumb">
            {p.breadcrumb.map((b, i) => (
              <span key={b.href} className="contents">
                <Link href={b.href} className="chip chip-glass !text-ink !text-[11px] hover:!bg-white transition">{b.label}</Link>
                <span className={`text-white/70${i === p.breadcrumb.length - 1 ? ' hidden sm:inline' : ''}`} aria-hidden="true">›</span>
              </span>
            ))}
            <b className="hidden sm:inline text-white/90 font-semibold truncate max-w-[260px]">{excerpt(p.title, 40)}</b>
          </nav>

          <div className="mt-6 grid lg:grid-cols-[1fr_auto] gap-6 items-end">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">{p.heroChips}</div>
              <p className="mt-5 text-[12px] font-bold tracking-[.14em] uppercase text-white/85">{p.eyebrow}</p>
              <h1 className="mt-1.5 text-[24px] md:text-[34px] font-extrabold leading-tight tracking-tight drop-shadow-sm">{p.title}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] font-medium text-white/90">{p.heroMeta}</div>
            </div>
            <ShareBar />
          </div>
        </div>
      </section>

      {/* ================= เนื้อหา ================= */}
      <section className="max-w-[1240px] mx-auto px-4 md:px-10 -mt-6 md:-mt-8 pb-12 relative z-10">
        <div className="grid lg:grid-cols-[1.65fr_.85fr] gap-6 lg:gap-7 items-start">

          {/* ================= คอลัมน์ซ้าย ================= */}
          <div className="min-w-0">
            {p.images.length > 0 && <WorkGallery images={p.images} title={p.title} />}

            <article className={`${p.images.length > 0 ? 'mt-7 ' : ''}card-soft rounded-[2rem] p-6 md:p-9`}>
              <div className="flex items-center gap-2.5 mb-5">
                <span className="w-10 h-10 rounded-2xl grad-bg grid place-items-center text-lg text-white shrink-0">{p.bodyIcon}</span>
                <h2 className="font-extrabold text-[18px] md:text-[20px] leading-tight">{p.bodyHeading}</h2>
              </div>

              {p.summary && (
                <p className="text-[14.5px] leading-loose text-ink-soft font-medium mb-6 pb-6 border-b border-dashed border-[color:var(--border)] relative pl-4">
                  <span className="absolute left-0 top-1 bottom-7 w-1 rounded-full grad-bg" aria-hidden="true" />
                  {p.summary}
                </p>
              )}

              <div className="rich">
                {!p.content
                  ? <p className="text-ink-muted">{p.emptyContentText}</p>
                  : p.content.includes('<')
                    ? <span dangerouslySetInnerHTML={{ __html: p.content }} />
                    : <p className="whitespace-pre-line">{p.content}</p>}
              </div>

              {p.note && (
                <div className={`mt-7 rounded-[1.4rem] border-2 border-dashed border-[color:var(--border)] ${t.noteBg} p-5`}>
                  <p className={`text-[11.5px] font-extrabold tracking-[.1em] uppercase ${t.noteText} mb-1.5`}>📝 หมายเหตุ</p>
                  <p className="text-[13px] leading-relaxed text-ink-soft whitespace-pre-line">{p.note}</p>
                </div>
              )}

              {ytId ? (
                <div className="mt-7">
                  <div className="flex items-center gap-2 mb-3"><span className="chip chip-1">▶️ วิดีโอประกอบ</span></div>
                  <div className="rounded-[1.6rem] overflow-hidden aspect-video bg-ink shadow-soft">
                    <iframe className="w-full h-full" src={`https://www.youtube-nocookie.com/embed/${ytId}`}
                      title={`วิดีโอประกอบ ${p.title}`} loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen />
                  </div>
                </div>
              ) : p.videoUrl ? (
                <div className="mt-7">
                  <a href={p.videoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">▶️ เปิดวิดีโอประกอบ</a>
                </div>
              ) : null}

              {p.linkUrl && (
                <div className="mt-5 pt-5 border-t border-[color:var(--divider)]">
                  <a href={p.linkUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                    🔗 {p.linkLabel || 'เปิดลิงก์ที่เกี่ยวข้อง'}
                  </a>
                </div>
              )}
            </article>
          </div>

          {/* ================= คอลัมน์ขวา ================= */}
          <aside className="min-w-0 flex flex-col gap-4">
            {p.extraAside}

            <div className="card-soft rounded-[1.8rem] p-5 md:p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <span className={`w-9 h-9 rounded-xl ${p.infoIconBg} grid place-items-center text-base shrink-0`}>📌</span>
                <h2 className="font-extrabold text-[15.5px]">{p.infoHeading}</h2>
              </div>
              <dl className="flex flex-col divide-y divide-[color:var(--divider)] text-[12.5px]">
                {p.info.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 py-2.5">
                    <dt className="text-ink-muted shrink-0">{k}</dt>
                    <dd className="font-bold text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {p.files.length > 0 && (
              <div className="card-soft rounded-[1.8rem] p-5 md:p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="w-9 h-9 rounded-xl bg-sunny-soft grid place-items-center text-base shrink-0">📎</span>
                  <h2 className="font-extrabold text-[15.5px]">ไฟล์แนบ <span className="text-ink-muted font-semibold">({p.files.length})</span></h2>
                </div>
                <div className="flex flex-col gap-2.5">
                  {p.files.map((f) => (
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

            <Link href={p.asideBackHref} className="btn btn-ghost w-full">{p.asideBackLabel}</Link>

            <AdminOnly>
              <Link href={p.editHref} className="btn btn-ink w-full">{p.editLabel}</Link>
            </AdminOnly>
          </aside>
        </div>

        {/* ================= ก่อนหน้า / ถัดไป ================= */}
        {(p.prev || p.next) && (
          <nav className="mt-10 grid sm:grid-cols-2 gap-4" aria-label="รายการอื่น">
            {p.prev ? (
              <Link href={p.prev.href} className="card-pop group flex items-center gap-3.5 !rounded-[1.5rem] px-4 py-4 min-h-[44px]">
                <span className={`w-11 h-11 shrink-0 rounded-full ${t.navBg} ${t.navText} grid place-items-center text-lg
                                 font-extrabold transition ${t.navHover} group-hover:text-white group-hover:-translate-x-0.5`} aria-hidden="true">←</span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-[10.5px] font-extrabold tracking-[.1em] uppercase ${t.navText}`}>{p.prev.label}</span>
                  <span className="block text-[13px] font-bold leading-snug line-2 mt-0.5">{p.prev.title}</span>
                  <span className="block text-[10.5px] text-ink-muted mt-0.5">{p.prev.meta}</span>
                </span>
              </Link>
            ) : <span className="hidden sm:block" />}

            {p.next && (
              <Link href={p.next.href} className="card-pop group flex items-center gap-3.5 !rounded-[1.5rem] px-4 py-4 min-h-[44px]">
                <span className="min-w-0 flex-1 text-right">
                  <span className={`block text-[10.5px] font-extrabold tracking-[.1em] uppercase ${t.navText}`}>{p.next.label}</span>
                  <span className="block text-[13px] font-bold leading-snug line-2 mt-0.5">{p.next.title}</span>
                  <span className="block text-[10.5px] text-ink-muted mt-0.5">{p.next.meta}</span>
                </span>
                <span className={`w-11 h-11 shrink-0 rounded-full ${t.navBg} ${t.navText} grid place-items-center text-lg
                                 font-extrabold transition ${t.navHover} group-hover:text-white group-hover:translate-x-0.5`} aria-hidden="true">→</span>
              </Link>
            )}
          </nav>
        )}

        <div className="mt-6 text-center">
          <Link href={p.footerHref} className="btn btn-primary">{p.footerLabel}</Link>
        </div>
      </section>
    </main>
  )
}
