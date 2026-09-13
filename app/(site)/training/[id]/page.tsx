import { notFound } from 'next/navigation'
import {
  getSelfDev, getSelfDevs, getItemImages, getItemFiles,
  getSelfDevNeighbors, getSelfDevCountByYear,
} from '@/lib/queries'
import { thaiDate, excerpt } from '@/lib/theme'
import { fileUrl } from '@/lib/media'
import ItemDetail from '@/components/ItemDetail'
import type { GalleryImage } from '@/components/WorkGallery'

/** หน้ารายละเอียดการพัฒนาตนเอง — แปลงมาจาก training.php ของเว็บ PHP */

const TYPE_CHIP: Record<string, string> = {
  'อบรม': 'chip-1', 'สัมมนา': 'chip-1', 'PLC': 'chip-2',
  'ศึกษาดูงาน': 'chip-3', 'วิทยากร': 'chip-accent',
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const s = await getSelfDev(Number(id))
  return {
    title: s?.title ?? 'ไม่พบรายการ',
    description: excerpt(s?.summary || s?.content || s?.organizer, 160),
  }
}

export async function generateStaticParams() {
  const list = await getSelfDevs()
  return list.map((s) => ({ id: String(s.id) }))
}

export default async function TrainingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const devId = Number(id)
  const dev = await getSelfDev(devId)
  if (!dev) notFound()

  const [imgs, files, neighbors, fyTotal] = await Promise.all([
    getItemImages('self_dev', devId), getItemFiles('self_dev', devId),
    getSelfDevNeighbors(dev.start_date, devId), getSelfDevCountByYear(dev.fiscal_year),
  ])

  // ไม่มีรูปในแกลเลอรี → ใช้เกียรติบัตรเป็นตัวสำรอง
  const images: GalleryImage[] = imgs.length > 0
    ? imgs.map((i) => ({ id: i.id, source: i.source, ref: i.ref, caption: i.caption }))
    : dev.certificate_ref
      ? [{ id: 0, source: dev.certificate_source ?? 'drive', ref: dev.certificate_ref, caption: 'เกียรติบัตร' }]
      : []

  // ช่วงวันที่ (ถ้ามีวันสิ้นสุดและไม่ตรงกับวันเริ่ม)
  const hasRange = !!dev.end_date && dev.end_date !== dev.start_date
  const dateLabel = thaiDate(dev.start_date, false) + (hasRange ? ` – ${thaiDate(dev.end_date, false)}` : '')
  const cert = fileUrl({ source: dev.certificate_source, ref: dev.certificate_ref })

  return (
    <ItemDetail
      tone="sky"
      watermark="3"
      breadcrumb={[{ href: '/', label: '🏠 หน้าแรก' }, { href: '/development', label: '🌱 การพัฒนาตนเอง' }]}
      eyebrow="การพัฒนาตนเองและวิชาชีพ"
      title={dev.title}
      heroChips={<>
        <span className="chip bg-white/20 backdrop-blur text-white border border-white/30">🌱 {dev.type}</span>
        <span className="chip chip-glass !text-ink">📅 {dateLabel}</span>
        <span className="chip chip-glass !text-ink">⏱️ {dev.hours} ชั่วโมง</span>
      </>}
      heroMeta={<>
        {dev.organizer && <span>🏛️ {dev.organizer}</span>}
        <span>🗓️ {dateLabel}</span>
        {images.length > 0 && <span>🖼️ {images.length} รูป</span>}
        {files.length > 0 && <span>📎 {files.length} ไฟล์</span>}
      </>}
      bodyIcon="🌱"
      bodyHeading={<>รายละเอียด<span className="grad-text">การพัฒนาตนเอง</span></>}
      emptyContentText="ยังไม่มีรายละเอียดเนื้อหาเพิ่มเติมสำหรับรายการนี้"
      summary={dev.summary}
      content={dev.content}
      note={dev.note}
      videoUrl={dev.video_url}
      linkUrl={dev.link_url}
      linkLabel={dev.link_label}
      infoIconBg="bg-sky-soft"
      infoHeading="ข้อมูลการพัฒนาตนเอง"
      info={[
        ['ประเภท', <span key="t" className={`chip ${TYPE_CHIP[dev.type] ?? 'chip-1'} !text-[11.5px]`}>{dev.type}</span>],
        ['หน่วยงานที่จัด', dev.organizer || '—'],
        ['ช่วงวันที่', dateLabel],
        ['จำนวนชั่วโมง', `${dev.hours} ชั่วโมง`],
        ['ปีงบประมาณ', String(dev.fiscal_year)],
        ['รูปภาพ / ไฟล์', `${images.length} รูป · ${files.length} ไฟล์`],
      ]}
      extraAside={cert ? (
        <a href={cert} target="_blank" rel="noopener noreferrer"
          className="card-pop rounded-[1.8rem] p-5 flex items-center gap-3.5 group">
          <span className="w-12 h-12 rounded-2xl bg-sunny-soft grid place-items-center text-2xl shrink-0 group-hover:scale-110 transition-transform">📜</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-extrabold">เกียรติบัตร / วุฒิบัตร</span>
            <span className="block text-[11.5px] text-ink-muted">คลิกเพื่อเปิดดูฉบับเต็ม</span>
          </span>
          <span className="text-ink-faint group-hover:text-primary-deep group-hover:translate-x-1 transition-all" aria-hidden="true">→</span>
        </a>
      ) : undefined}
      images={images}
      files={files}
      prev={neighbors.prev ? {
        href: `/training/${neighbors.prev.id}`, label: 'รายการก่อนหน้า', title: neighbors.prev.title,
        meta: `📅 ${thaiDate(neighbors.prev.start_date)} · ${neighbors.prev.type}`,
      } : null}
      next={neighbors.next ? {
        href: `/training/${neighbors.next.id}`, label: 'รายการถัดไป', title: neighbors.next.title,
        meta: `📅 ${thaiDate(neighbors.next.start_date)} · ${neighbors.next.type}`,
      } : null}
      asideBackHref={`/development/${dev.fiscal_year}`}
      asideBackLabel={`🌱 ดูรายการปีงบประมาณ ${dev.fiscal_year} (${fyTotal} รายการ)`}
      editHref={`/admin/self-dev?fy=${dev.fiscal_year}`}
      editLabel="✏️ แก้ไขรายการนี้"
      footerHref={`/development/${dev.fiscal_year}`}
      footerLabel={`ดูรายการพัฒนาตนเองปี ${dev.fiscal_year} ทั้งหมด (${fyTotal} รายการ)`}
    />
  )
}
