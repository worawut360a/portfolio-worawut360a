'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Modal from './Modal'
import { saveCareer, deleteCareer } from '@/app/admin/profile/actions'
import { confirmDelete, toastSuccess, toastError, alertError } from '@/lib/ui'
import type { CareerPath } from '@/lib/types'

interface Draft {
  id: number; period: string; position: string; school: string
  is_current: boolean; sort_order: number
}
const BLANK: Draft = { id: 0, period: '', position: '', school: '', is_current: false, sort_order: 1 }

/** การ์ด “เส้นทางรับราชการ” พร้อมตารางและโมดัล — ยกมาจาก admin/profile.php */
export default function CareerSection({ rows }: { rows: CareerPath[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [d, setD] = useState<Draft>(BLANK)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [, startTransition] = useTransition()

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }))

  const add = () => { setD({ ...BLANK, sort_order: rows.length + 1 }); setErr(''); setOpen(true) }
  const edit = (c: CareerPath) => {
    setD({
      id: Number(c.id), period: c.period, position: c.position, school: c.school ?? '',
      is_current: Number(c.is_current) === 1, sort_order: Number(c.sort_order ?? 1),
    })
    setErr(''); setOpen(true)
  }

  async function submit(f: FormData) {
    setBusy(true)
    try {
      const r = await saveCareer(f)
      if (!r.ok) { setErr(r.error); toastError(r.error); return }
      toastSuccess('บันทึกเส้นทางรับราชการสำเร็จ!')
      setOpen(false)
      startTransition(() => router.refresh())
    } finally {
      setBusy(false)
    }
  }

  async function remove(c: CareerPath) {
    if (!(await confirmDelete(c.position))) return
    try {
      const r = await deleteCareer(Number(c.id))
      if (!r.ok) { alertError(r.error || 'ลบไม่สำเร็จ'); return }
      toastSuccess('ลบเรียบร้อยแล้ว')
      startTransition(() => router.refresh())
    } catch {
      alertError('ลบไม่สำเร็จ')
    }
  }

  return (
    <section className="mt-4 bg-white rounded-[1.6rem] p-6 shadow-soft border border-[color:var(--border)]">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-2xl grid place-items-center text-lg bg-mint-soft shrink-0">🧭</span>
          <div>
            <h2 className="font-bold text-[16px]">เส้นทางรับราชการ</h2>
            <p className="text-[12px] text-ink-muted">{rows.length} รายการ · ติ๊ก “ปัจจุบัน” ให้ตำแหน่งล่าสุด</p>
          </div>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={add}>+ เพิ่มรายการ</button>
      </div>

      {rows.length > 0 ? (
        <div className="overflow-x-auto mt-4">
          <table className="adm-table min-w-[560px] md:min-w-0">
            <thead><tr><th className="col-no">#</th><th>ช่วงเวลา</th><th>ตำแหน่ง</th><th>สถานศึกษา</th><th>ปัจจุบัน</th><th>จัดการ</th></tr></thead>
            <tbody>
              {rows.map((c, i) => (
                <tr key={c.id}>
                  <td className="col-no" data-label="ลำดับ">{i + 1}</td>
                  <td data-label="ช่วงเวลา"><span className="chip chip-primary">{c.period}</span></td>
                  <td data-label="ตำแหน่ง"><b>{c.position}</b></td>
                  <td data-label="สถานศึกษา" className="text-ink-soft">{c.school}</td>
                  <td data-label="ปัจจุบัน">
                    {Number(c.is_current) === 1
                      ? <span className="chip chip-2">✅ ปัจจุบัน</span>
                      : <span className="text-ink-faint">—</span>}
                  </td>
                  <td data-label="จัดการ">
                    <div className="inline-flex gap-1.5">
                      <button type="button" className="icon-btn edit" title="แก้ไข" aria-label="แก้ไข" onClick={() => edit(c)}>✏️</button>
                      <button type="button" className="icon-btn del" title="ลบ" aria-label="ลบ" onClick={() => void remove(c)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4 text-center py-10">
          <div className="text-5xl mb-3">🧭</div>
          <p className="text-[13px] text-ink-muted">ยังไม่มีรายการ · กด “+ เพิ่มรายการ” เพื่อเริ่มต้น</p>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} maxWidth={560}
        title={d.id ? '✏️ แก้ไขเส้นทางรับราชการ' : '🧭 เพิ่มเส้นทางรับราชการ'}>
        <form action={submit} autoComplete="off">
          <input type="hidden" name="id" value={d.id} />
          <div className="modal-body">
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="lbl req" htmlFor="c_period">ช่วงเวลา</label>
                <input className="inp" id="c_period" name="period" required maxLength={60} placeholder="2565 – ปัจจุบัน"
                  value={d.period} onChange={(e) => set('period', e.target.value)} />
                <span className="field-error">{err}</span>
              </div>
              <div>
                <label className="lbl req" htmlFor="c_pos">ตำแหน่ง</label>
                <input className="inp" id="c_pos" name="position" required maxLength={120} placeholder="ครูชำนาญการ (คศ.2)"
                  value={d.position} onChange={(e) => set('position', e.target.value)} />
                <span className="field-error"></span>
              </div>
            </div>
            <div className="mb-4">
              <label className="lbl" htmlFor="c_school">สถานศึกษา</label>
              <input className="inp" id="c_school" name="school" maxLength={150} placeholder="โรงเรียน…"
                value={d.school} onChange={(e) => set('school', e.target.value)} />
              <span className="field-error"></span>
            </div>
            <div className="flex items-center gap-3 flex-wrap bg-primary-soft/60 rounded-2xl px-4 py-3">
              <label className="flex items-center gap-2.5 cursor-pointer min-h-[44px]">
                <input type="checkbox" id="c_cur" name="is_current" value="1"
                  className="w-5 h-5 rounded accent-[color:var(--primary)]"
                  checked={d.is_current} onChange={(e) => set('is_current', e.target.checked)} />
                <span className="text-[13px] font-semibold">✅ ตำแหน่งปัจจุบัน</span>
              </label>
              <label className="ml-auto flex items-center gap-2 text-[12.5px] font-semibold text-ink-soft" htmlFor="c_sort">
                ลำดับ
                <input className="inp !w-20 !py-1.5 text-center" id="c_sort" name="sort_order" type="number"
                  value={d.sort_order} onChange={(e) => set('sort_order', Number(e.target.value))} />
              </label>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'กำลังบันทึก…' : '💾 บันทึก'}</button>
          </div>
        </form>
      </Modal>
    </section>
  )
}
