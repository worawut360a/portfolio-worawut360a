import { requireAdmin } from '@/lib/auth'
import { getSelfDevs, getSelfDevYearStats, getItemAttachmentCounts } from '@/lib/queries'
import { thaiDate, currentFiscalYear } from '@/lib/theme'
import { fileUrl } from '@/lib/media'
import PageHead from '@/components/admin/PageHead'
import CountUp from '@/components/CountUp'
import YearSelect from '@/components/YearSelect'
import { SelfDevProvider, NewSelfDevButton } from '@/components/admin/SelfDevModal'
import SelfDevTable, { type SelfDevRow } from '@/components/admin/SelfDevTable'

/** จัดการการพัฒนาตนเองและวิชาชีพ (ด้านที่ 3) — แปลงจาก admin/self-dev.php */
export default async function SelfDevAdmin({
  searchParams,
}: { searchParams: Promise<{ fy?: string }> }) {
  await requireAdmin()   // ต้องตรวจในทุกหน้า ไม่ใช่แค่ layout — Next render layout กับ page พร้อมกัน
  const sp = await searchParams

  const stats = await getSelfDevYearStats()
  const fyList = [...stats.keys()].sort((a, b) => b - a)
  if (fyList.length === 0) fyList.push(currentFiscalYear())

  const fy = Number(sp.fy) || fyList[0]!
  const [items, counts] = await Promise.all([
    getSelfDevs(fy), getItemAttachmentCounts('self_dev'),
  ])
  const hours = items.reduce((s, r) => s + Number(r.hours || 0), 0)

  // ปีปัจจุบันต้องเลือกได้เสมอ แม้ยังไม่มีรายการสักอัน
  const yearOptions = fyList.includes(currentFiscalYear()) ? fyList : [currentFiscalYear(), ...fyList]

  const rows: SelfDevRow[] = items.map((s) => {
    const n = counts.get(Number(s.id)) ?? { images: 0, files: 0 }
    return {
      id: Number(s.id),
      type: s.type,
      title: s.title,
      summary: s.summary ?? '',
      note: s.note ?? '',
      organizer: s.organizer ?? '',
      hasContent: !!s.content,
      hasVideo: !!s.video_url,
      dateText: thaiDate(s.start_date)
        + (s.end_date && s.end_date !== s.start_date ? ` – ${thaiDate(s.end_date)}` : ''),
      hours: Number(s.hours || 0),
      certUrl: fileUrl({ source: s.certificate_source, ref: s.certificate_ref }),
      images: n.images,
      files: n.files,
    }
  })

  return (
    <SelfDevProvider fiscalYear={fy}>
      <PageHead
        title="การพัฒนาตนเอง 🌱"
        sub="อบรม · สัมมนา · ศึกษาดูงาน · PLC · วิทยากร (แยกตามปีงบประมาณ)"
        actions={<NewSelfDevButton className="btn btn-primary text-[12.5px]">+ เพิ่มรายการ</NewSelfDevButton>}
      />

      {/* สถิติหัวหน้า */}
      <div className="mt-5 grid sm:grid-cols-3 gap-3.5">
        {/* ชั่วโมงรวม */}
        <div className="relative overflow-hidden bg-white rounded-[1.6rem] p-5 shadow-soft border border-[color:var(--border)] flex items-center gap-4">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-mint-soft opacity-70 pointer-events-none" aria-hidden="true" />
          <div className="relative w-11 h-11 rounded-2xl grid place-items-center text-xl bg-mint-soft shrink-0">⏱️</div>
          <div className="relative min-w-0">
            <span className="block text-[12px] text-ink-muted font-medium">ชั่วโมงรวม ปีงบประมาณ {fy}</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="stat-num bg-gradient-to-br from-mint to-sky bg-clip-text text-transparent"><CountUp to={hours} /></span>
              <span className="text-[12.5px] text-ink-muted font-semibold">ชั่วโมง</span>
            </div>
          </div>
        </div>

        {/* จำนวนรายการ */}
        <div className="relative overflow-hidden bg-white rounded-[1.6rem] p-5 shadow-soft border border-[color:var(--border)] flex items-center gap-4">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-sky-soft opacity-70 pointer-events-none" aria-hidden="true" />
          <div className="relative w-11 h-11 rounded-2xl grid place-items-center text-xl bg-sky-soft shrink-0">📚</div>
          <div className="relative min-w-0">
            <span className="block text-[12px] text-ink-muted font-medium">จำนวนรายการ</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="stat-num bg-gradient-to-br from-sky to-[#1D4ED8] bg-clip-text text-transparent"><CountUp to={items.length} /></span>
              <span className="text-[12.5px] text-ink-muted font-semibold">รายการ</span>
            </div>
          </div>
        </div>

        {/* เลือกปีงบประมาณ */}
        <div className="bg-white rounded-[1.6rem] p-5 shadow-soft border border-[color:var(--border)] flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl grid place-items-center text-xl bg-sunny-soft shrink-0">📅</div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-ink-muted font-medium">เลือกปีงบประมาณ</p>
            <div className="mt-1.5">
              <YearSelect label="" tone="light" head="เลือกปีงบประมาณ"
                items={yearOptions.map((y) => ({
                  year: y,
                  meta: `${stats.get(y)?.h ?? 0} ชม.`,
                  url: `/admin/self-dev?fy=${y}`,
                  active: y === fy,
                }))} />
            </div>
          </div>
        </div>
      </div>

      <SelfDevTable rows={rows} fiscalYear={fy} />
    </SelfDevProvider>
  )
}
