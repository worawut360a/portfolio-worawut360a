import Link from 'next/link'
import type { Work } from '@/lib/types'
import { imageUrl, IMG } from '@/lib/media'
import { domainTheme } from '@/lib/theme'

/** การ์ดผลงาน 1 ใบ — แปลงจาก partials/work-card.php ของเว็บ PHP */
export default function WorkCard({
  work, images = 0, files = 0,
}: { work: Work; images?: number; files?: number }) {
  const t = domainTheme(work.domain_code)
  const indName = (work.indicator_name ?? '').slice(0, 26)

  return (
    <article className="card-pop overflow-hidden group">
      <Link href={`/work/${work.slug}`} className="block">
        <div className="relative h-[190px] overflow-hidden rounded-t-[inherit] bg-[color:var(--divider)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl({ source: work.cover_source, ref: work.cover_ref }, IMG.card)}
            className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700 ease-out"
            alt={`ภาพประกอบผลงาน ${work.title}`} width={800} height={500} loading="lazy" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/60 to-transparent" />
          <span className="absolute left-3 bottom-3 chip chip-glass !text-[11px]">
            <span className="w-2 h-2 rounded-full" style={{ background: t.solid }} />
            {work.indicator_code} · {indName}
          </span>
          {work.is_featured === 1 && (
            <span className="absolute top-3 right-3 chip chip-grad !text-[11px]">⭐ เด่น</span>
          )}
          {work.status === 'draft' && (
            <span className="absolute top-3 left-3 chip chip-ink !text-[11px]">ฉบับร่าง</span>
          )}
        </div>

        <div className="p-5">
          <h3 className="text-[15.5px] md:text-base font-semibold leading-snug line-2 group-hover:text-primary-deep transition-colors">{work.title}</h3>
          <div className="mt-3 flex items-center justify-between gap-2 text-[11.5px] text-ink-muted font-medium">
            <span>📅 {work.semester}/{work.academic_year}</span>
            <span className="flex items-center gap-2">
              {images > 0 && <span>🖼️ {images}</span>}
              {files > 0 && <span>📎 {files}</span>}
              <span>👁️ {work.view_count.toLocaleString('th-TH')}</span>
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}
