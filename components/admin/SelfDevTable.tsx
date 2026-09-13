'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useSelfDevModal } from './SelfDevModal'
import { deleteSelfDev } from '@/lib/item-actions'
import { confirmDelete, toastSuccess, alertError } from '@/lib/ui'

export interface SelfDevRow {
  id: number; type: string; title: string; summary: string; note: string
  organizer: string; hasContent: boolean; hasVideo: boolean
  dateText: string; hours: number
  certUrl: string | null
  images: number; files: number
}

const CHIP: Record<string, string> = {
  อบรม: 'chip-1', สัมมนา: 'chip-1', PLC: 'chip-2', ศึกษาดูงาน: 'chip-3', วิทยากร: 'chip-accent',
}

/** ตารางรายการพัฒนาตนเอง + ช่องค้นหาแบบกรองสด — ยกมาจาก admin/self-dev.php */
export default function SelfDevTable({
  rows, fiscalYear,
}: { rows: SelfDevRow[]; fiscalYear: number }) {
  const router = useRouter()
  const { edit } = useSelfDevModal()
  const [q, setQ] = useState('')
  const [, startTransition] = useTransition()

  const needle = q.trim().toLowerCase()
  const shown = needle
    ? rows.filter((r) => [r.title, r.summary, r.note, r.organizer, r.type, r.dateText]
        .join(' ').toLowerCase().includes(needle))
    : rows

  async function remove(r: SelfDevRow) {
    if (!(await confirmDelete(r.title))) return
    try {
      const res = await deleteSelfDev(r.id)
      if (!res.ok) { alertError(res.error || 'ลบไม่สำเร็จ'); return }
      toastSuccess(`ลบ “${r.title}” เรียบร้อยแล้ว`)
      startTransition(() => router.refresh())
    } catch {
      alertError('ลบไม่สำเร็จ')
    }
  }

  return (
    <section className="mt-4 bg-white rounded-[1.6rem] p-5 md:p-6 shadow-soft border border-[color:var(--border)]">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-2xl grid place-items-center text-lg bg-sky-soft shrink-0">🌱</span>
          <div>
            <h2 className="font-bold text-[16px]">รายการพัฒนาตนเอง</h2>
            <p className="text-[12px] text-ink-muted">ปีงบประมาณ {fiscalYear} · {rows.length} รายการ</p>
          </div>
        </div>
        <label className="flex items-center gap-2 bg-white border-2 border-[color:var(--border)] focus-within:border-primary rounded-full px-4 min-h-[44px] text-[12.5px] w-full sm:w-72 transition-colors">
          <span>🔍</span>
          <input type="search" placeholder="ค้นหาชื่อหลักสูตร / หน่วยงาน…" aria-label="ค้นหา"
            className="bg-transparent outline-none w-full"
            value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="adm-table min-w-[940px] md:min-w-0">
          <thead>
            <tr><th className="col-no">#</th><th>ประเภท</th><th>ชื่อหลักสูตร / กิจกรรม</th><th>หน่วยงาน</th><th>วันที่</th><th>ชั่วโมง</th><th>เกียรติบัตร</th><th>รูป/ไฟล์</th><th>จัดการ</th></tr>
          </thead>
          <tbody>
            {shown.map((s, i) => (
              <tr key={s.id}>
                <td className="col-no" data-label="ลำดับ">{i + 1}</td>
                <td data-label="ประเภท"><span className={`chip ${CHIP[s.type] ?? 'chip-1'}`}>{s.type}</span></td>
                <td data-label="ชื่อหลักสูตร">
                  <b>{s.title}</b>
                  {s.summary
                    ? <span className="block text-[11.5px] text-ink-soft font-normal mt-0.5 line-2">{s.summary}</span>
                    : s.note ? <span className="block text-[11.5px] text-ink-muted font-normal mt-0.5 line-2">{s.note}</span> : null}
                  {(s.hasContent || s.hasVideo) && (
                    <span className="mt-1 inline-flex flex-wrap gap-1">
                      {s.hasContent && <span className="chip chip-accent !text-[10px] !px-2 !py-0.5" title="มีเนื้อหารายละเอียด">📝 รายละเอียด</span>}
                      {s.hasVideo && <span className="chip chip-3 !text-[10px] !px-2 !py-0.5" title="มีวิดีโอ">🎬 วิดีโอ</span>}
                    </span>
                  )}
                </td>
                <td data-label="หน่วยงาน" className="text-ink-soft">{s.organizer}</td>
                <td data-label="วันที่" className="text-ink-soft whitespace-nowrap">{s.dateText}</td>
                <td data-label="ชั่วโมง"><span className="chip chip-primary">⏱ {s.hours} ชม.</span></td>
                <td data-label="เกียรติบัตร">
                  {s.certUrl
                    ? <a href={s.certUrl} target="_blank" rel="noreferrer" className="chip chip-accent hover:-translate-y-0.5 transition-transform">📜 เปิด</a>
                    : <span className="text-ink-faint">—</span>}
                </td>
                <td data-label="รูป/ไฟล์">
                  <span className="inline-flex flex-wrap gap-1 whitespace-nowrap">
                    <span className={`chip !text-[10.5px] ${s.images ? 'chip-primary' : 'bg-[color:var(--divider)] text-ink-faint'}`} title="จำนวนรูปภาพ">🖼️ {s.images}</span>
                    <span className={`chip !text-[10.5px] ${s.files ? 'chip-2' : 'bg-[color:var(--divider)] text-ink-faint'}`} title="จำนวนไฟล์แนบ">📎 {s.files}</span>
                  </span>
                </td>
                <td data-label="จัดการ">
                  <div className="inline-flex gap-1.5">
                    <a className="icon-btn" href={`/training/${s.id}`} target="_blank" rel="noopener noreferrer" title="ดูหน้าเว็บ" aria-label="ดูหน้าเว็บ">👁️</a>
                    <button type="button" className="icon-btn edit" title="แก้ไข" aria-label="แก้ไข"
                      onClick={() => void edit(s.id)}>✏️</button>
                    <button type="button" className="icon-btn del" title="ลบ" aria-label="ลบ"
                      onClick={() => void remove(s)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <div className="text-center py-14">
          <div className="text-5xl mb-3">🌱</div>
          <p className="text-[13px] text-ink-muted">ยังไม่มีรายการในปีงบประมาณ {fiscalYear}</p>
          <p className="text-[12px] text-ink-faint mt-1">กด “+ เพิ่มรายการ” ด้านบนเพื่อบันทึกการอบรม สัมมนา หรือ PLC</p>
        </div>
      )}
      {rows.length > 0 && shown.length === 0 && (
        <p className="text-center text-ink-muted py-8 text-[13px]">
          <span className="block text-4xl mb-2">🔍</span>ไม่พบรายการที่ค้นหา
        </p>
      )}
    </section>
  )
}
