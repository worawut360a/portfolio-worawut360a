'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteWork } from '@/app/admin/indicator/[id]/actions'
import { confirmDelete, toastSuccess, alertError } from '@/lib/ui'

export interface RecentRow {
  id: number; title: string; indicator_id: number; indicator_code: string; indicator_name: string
  semester: number; academic_year: number; status: string; view_count: number
  chipBg: string; chipText: string
}

/** ตารางผลงานล่าสุดบนแดชบอร์ด + ค้นหาแบบเรียลไทม์ — ยกมาจาก admin/index.php */
export default function RecentWorksTable({ rows }: { rows: RecentRow[] }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [, startTransition] = useTransition()

  const needle = q.trim().toLowerCase()
  const shown = needle
    ? rows.filter((r) => [r.title, r.indicator_code, r.indicator_name, String(r.academic_year)]
        .join(' ').toLowerCase().includes(needle))
    : rows

  async function remove(r: RecentRow) {
    if (!(await confirmDelete(r.title))) return
    try {
      const res = await deleteWork(r.id)
      if (!res.ok) { alertError(res.error || 'ลบไม่สำเร็จ'); return }
      toastSuccess(`ลบผลงาน “${r.title}” เรียบร้อยแล้ว`)
      startTransition(() => router.refresh())
    } catch {
      alertError('ลบไม่สำเร็จ')
    }
  }

  return (
    <>
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div>
          <h2 className="font-bold text-[16px]">🗂️ ผลงานล่าสุด</h2>
          <p className="text-[12px] text-ink-muted mt-0.5">6 รายการล่าสุด รวมฉบับร่าง</p>
        </div>
        <label className="flex items-center gap-2 bg-white border-2 border-[color:var(--border)] focus-within:border-primary focus-within:shadow-glow transition rounded-full px-4 min-h-[44px] text-[12.5px]">
          <span>🔍</span>
          <input type="search" placeholder="ค้นหาแบบเรียลไทม์…" aria-label="ค้นหาผลงาน"
            className="bg-transparent outline-none w-44 text-ink"
            value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      <div className={`overflow-x-auto mt-4${rows.length ? '' : ' hidden'}`}>
        <table className="adm-table min-w-[720px] md:min-w-0">
          <thead>
            <tr><th className="col-no">#</th><th>ชื่อผลงาน</th><th>ตัวชี้วัด</th><th>ปีการศึกษา</th><th>สถานะ</th><th>เข้าชม</th><th>จัดการ</th></tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={r.id}>
                <td className="col-no" data-label="ลำดับ">{i + 1}</td>
                <td data-label="ชื่อผลงาน"><b className="text-ink">{r.title}</b></td>
                <td data-label="ตัวชี้วัด">
                  <Link href={`/admin/indicator/${r.indicator_id}`}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold hover:-translate-y-0.5 transition"
                    style={{ background: r.chipBg, color: r.chipText }}>
                    {r.indicator_code} {r.indicator_name}
                  </Link>
                </td>
                <td data-label="ปีการศึกษา">{r.semester}/{r.academic_year}</td>
                <td data-label="สถานะ">
                  <span className={`chip ${r.status === 'published' ? 'chip-2' : 'chip-accent'}`}>
                    {r.status === 'published' ? 'เผยแพร่' : 'ฉบับร่าง'}
                  </span>
                </td>
                <td data-label="เข้าชม">{r.view_count || '—'}</td>
                <td data-label="จัดการ">
                  <Link href={`/admin/indicator/${r.indicator_id}?edit=${r.id}`} className="icon-btn edit" title="แก้ไข">✏️</Link>
                  <button type="button" className="icon-btn del" title="ลบ" onClick={() => void remove(r)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && shown.length === 0 && (
        <p className="text-center text-ink-muted py-8 text-[13px]">🔍 ไม่พบผลงานที่ค้นหา</p>
      )}
    </>
  )
}
