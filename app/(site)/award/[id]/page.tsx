import { notFound } from 'next/navigation'
import {
  getAward, getAwards, getItemImages, getItemFiles, getAwardNeighbors,
} from '@/lib/queries'
import { thaiDate, excerpt } from '@/lib/theme'
import ItemDetail from '@/components/ItemDetail'
import type { GalleryImage } from '@/components/WorkGallery'

/** หน้ารายละเอียดรางวัล — แปลงมาจาก award.php ของเว็บ PHP */

const LEVEL_CHIP: Record<string, string> = {
  'โรงเรียน': 'chip-1', 'เขตพื้นที่': 'chip-2', 'จังหวัด': 'chip-3',
  'ภาค': 'chip-accent', 'ชาติ': 'chip-accent', 'นานาชาติ': 'chip-accent',
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const a = await getAward(Number(id))
  return {
    title: a?.title ?? 'ไม่พบรางวัล',
    description: excerpt(a?.summary || a?.content || a?.awarder, 160),
  }
}

export async function generateStaticParams() {
  const list = await getAwards()
  return list.map((a) => ({ id: String(a.id) }))
}

export default async function AwardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const awId = Number(id)
  const award = await getAward(awId)
  if (!award) notFound()

  const [imgs, files, neighbors, all] = await Promise.all([
    getItemImages('award', awId), getItemFiles('award', awId),
    getAwardNeighbors(award.award_date, awId), getAwards(),
  ])

  // ไม่มีรูปในแกลเลอรี → ใช้รูปปกเดิมเป็นตัวสำรอง (เหมือน award.php)
  const images: GalleryImage[] = imgs.length > 0
    ? imgs.map((i) => ({ id: i.id, source: i.source, ref: i.ref, caption: i.caption }))
    : award.image_ref
      ? [{ id: 0, source: award.image_source ?? 'drive', ref: award.image_ref, caption: '' }]
      : []

  return (
    <ItemDetail
      watermark="3"
      breadcrumb={[{ href: '/', label: '🏠 หน้าแรก' }, { href: '/development', label: '🌱 การพัฒนาตนเอง' }]}
      eyebrow="รางวัลและเกียรติคุณ"
      title={award.title}
      heroChips={<>
        <span className="chip bg-white/20 backdrop-blur text-white border border-white/30">🏅 ระดับ{award.level}</span>
        <span className="chip chip-glass !text-ink">📅 {thaiDate(award.award_date, false)}</span>
      </>}
      heroMeta={<>
        {award.awarder && <span>🏛️ {award.awarder}</span>}
        <span>🗓️ {thaiDate(award.award_date, false)}</span>
        {images.length > 0 && <span>🖼️ {images.length} รูป</span>}
        {files.length > 0 && <span>📎 {files.length} ไฟล์</span>}
      </>}
      bodyIcon="🏅"
      bodyHeading={<>รายละเอียด<span className="grad-text">รางวัล</span></>}
      emptyContentText="ยังไม่มีรายละเอียดเนื้อหาเพิ่มเติมสำหรับรางวัลนี้"
      summary={award.summary}
      content={award.content}
      note={award.note}
      videoUrl={award.video_url}
      linkUrl={award.link_url}
      linkLabel={award.link_label}
      infoIconBg="bg-primary-soft"
      infoHeading="ข้อมูลรางวัล"
      info={[
        ['ระดับ', <span key="lv" className={`chip ${LEVEL_CHIP[award.level] ?? 'chip-1'} !text-[11.5px]`}>ระดับ{award.level}</span>],
        ['หน่วยงานที่มอบ', award.awarder || '—'],
        ['วันที่ได้รับ', thaiDate(award.award_date, false)],
        ['รูปภาพ / ไฟล์', `${images.length} รูป · ${files.length} ไฟล์`],
      ]}
      images={images}
      files={files}
      prev={neighbors.prev ? {
        href: `/award/${neighbors.prev.id}`, label: 'รางวัลก่อนหน้า', title: neighbors.prev.title,
        meta: `📅 ${thaiDate(neighbors.prev.award_date)} · ระดับ${neighbors.prev.level}`,
      } : null}
      next={neighbors.next ? {
        href: `/award/${neighbors.next.id}`, label: 'รางวัลถัดไป', title: neighbors.next.title,
        meta: `📅 ${thaiDate(neighbors.next.award_date)} · ระดับ${neighbors.next.level}`,
      } : null}
      asideBackHref="/development"
      asideBackLabel="🌱 กลับหน้าการพัฒนาตนเอง"
      editHref="/admin/awards"
      editLabel="✏️ แก้ไขรางวัลนี้"
      footerHref="/development"
      footerLabel={`ดูรางวัลและเกียรติคุณทั้งหมด (${all.length} รางวัล)`}
    />
  )
}
