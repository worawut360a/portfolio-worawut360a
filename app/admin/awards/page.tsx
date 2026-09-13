import { requireAdmin } from '@/lib/auth'
import { getAwards, getItemAttachmentCounts } from '@/lib/queries'
import { thaiDate } from '@/lib/theme'
import { imageUrl, IMG } from '@/lib/media'
import PageHead from '@/components/admin/PageHead'
import { AwardProvider, NewAwardButton } from '@/components/admin/AwardModal'
import AwardGrid, { type AwardCard } from '@/components/admin/AwardGrid'

/** จัดการรางวัล/เกียรติคุณ — แปลงจาก admin/awards.php */
export default async function AwardsAdmin() {
  await requireAdmin()   // ต้องตรวจในทุกหน้า ไม่ใช่แค่ layout — Next render layout กับ page พร้อมกัน

  const [awards, counts] = await Promise.all([
    getAwards(), getItemAttachmentCounts('award'),
  ])

  const cards: AwardCard[] = awards.map((a) => {
    const n = counts.get(Number(a.id)) ?? { images: 0, files: 0 }
    const m = { source: a.image_source, ref: a.image_ref }
    return {
      id: Number(a.id),
      title: a.title,
      level: a.level,
      awarder: a.awarder ?? '',
      dateText: thaiDate(a.award_date),
      summary: a.summary ?? '',
      note: a.note ?? '',
      cover: imageUrl(m, IMG.card),
      coverFull: imageUrl(m, IMG.full),
      hasContent: !!a.content,
      hasVideo: !!a.video_url,
      images: n.images,
      files: n.files,
    }
  })

  return (
    <AwardProvider>
      <PageHead
        title="รางวัลและเกียรติคุณ 🏅"
        sub="แสดงบนหน้าประวัติครูและตัวเลขสถิติหน้าแรก"
        actions={<NewAwardButton className="btn btn-primary text-[12.5px]">+ เพิ่มรางวัล</NewAwardButton>}
      />

      <section className="mt-5">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl grid place-items-center text-lg bg-sunny-soft shrink-0">🏅</span>
            <div>
              <h2 className="font-bold text-[16px]">รางวัลทั้งหมด</h2>
              <p className="text-[12px] text-ink-muted">
                {cards.length} รายการ · คลิกรูปเพื่อดูขนาดเต็ม · ✏️ เพื่อเพิ่มรูป/ไฟล์แนบ
              </p>
            </div>
          </div>
        </div>

        <AwardGrid awards={cards} />
      </section>
    </AwardProvider>
  )
}
