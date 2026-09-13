'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Modal from './Modal'
import { saveEducation, deleteEducation } from '@/app/admin/profile/actions'
import { confirmDelete, toastSuccess, toastError, alertError } from '@/lib/ui'
import type { Education } from '@/lib/types'

interface Draft { id: number; year_th: string; degree: string; institute: string; sort_order: number }
const BLANK: Draft = { id: 0, year_th: '', degree: '', institute: '', sort_order: 1 }

/** การ์ด “วุฒิการศึกษา” พร้อมตารางและโมดัล — ยกมาจาก admin/profile.php */
export default function EducationSection({ rows }: { rows: Education[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [d, setD] = useState<Draft>(BLANK)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [, startTransition] = useTransition()

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }))

  const add = () => { setD({ ...BLANK, sort_order: rows.length + 1 }); setErr(''); setOpen(true) }
  const edit = (e: Education) => {
    setD({
      id: Number(e.id), year_th: String(e.year_th), degree: e.degree,
      institute: e.institute ?? '', sort_order: Number(e.sort_order ?? 1),
    })
    setErr(''); setOpen(true)
  }

  async function submit(f: FormData) {
    setBusy(true)
    try {
      const r = await saveEducation(f)
      if (!r.ok) { setErr(r.error); toastError(r.error); return }
      toastSuccess('บันทึกวุฒิการศึกษาสำเร็จ!')
      setOpen(false)
      startTransition(() => router.refresh())
    } finally {
      setBusy(false)
    }
  }

  async function remove(e: Education) {
    if (!(await confirmDelete(e.degree))) return
    try {
      const r = await deleteEducation(Number(e.id))
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
          <span className="w-10 h-10 rounded-2xl grid place-items-center text-lg bg-sky-soft shrink-0">🎓</span>
          <div>
            <h2 className="font-bold text-[16px]">วุฒิการศึกษา</h2>
            <p className="text-[12px] text-ink-muted">{rows.length} รายการ · เรียงตามลำดับการแสดง</p>
          </div>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={add}>+ เพิ่มวุฒิการศึกษา</button>
      </div>

      {rows.length > 0 ? (
        <div className="overflow-x-auto mt-4">
          <table className="adm-table min-w-[560px] md:min-w-0">
            <thead><tr><th className="col-no">#</th><th>ปี พ.ศ.</th><th>วุฒิการศึกษา</th><th>สถาบัน</th><th>จัดการ</th></tr></thead>
            <tbody>
              {rows.map((ed, i) => (
                <tr key={ed.id}>
                  <td className="col-no" data-label="ลำดับ">{i + 1}</td>
                  <td data-label="ปี พ.ศ."><span className="chip chip-3">{ed.year_th}</span></td>
                  <td data-label="วุฒิการศึกษา"><b>{ed.degree}</b></td>
                  <td data-label="สถาบัน" className="text-ink-soft">{ed.institute}</td>
                  <td data-label="จัดการ">
                    <div className="inline-flex gap-1.5">
                      <button type="button" className="icon-btn edit" title="แก้ไข" aria-label="แก้ไข" onClick={() => edit(ed)}>✏️</button>
                      <button type="button" className="icon-btn del" title="ลบ" aria-label="ลบ" onClick={() => void remove(ed)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4 text-center py-10">
          <div className="text-5xl mb-3">🎓</div>
          <p className="text-[13px] text-ink-muted">ยังไม่มีวุฒิการศึกษา · กด “+ เพิ่มวุฒิการศึกษา” เพื่อเริ่มต้น</p>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} maxWidth={560}
        title={d.id ? '✏️ แก้ไขวุฒิการศึกษา' : '🎓 เพิ่มวุฒิการศึกษา'}>
        <form action={submit} autoComplete="off">
          <input type="hidden" name="id" value={d.id} />
          <div className="modal-body">
            <div className="grid sm:grid-cols-[150px_1fr] gap-4 mb-4">
              <div>
                <label className="lbl req" htmlFor="e_year">ปี พ.ศ. ที่สำเร็จ</label>
                <input className="inp" id="e_year" name="year_th" type="number" required min={2400} max={2700}
                  placeholder="2560" value={d.year_th} onChange={(ev) => set('year_th', ev.target.value)} />
                <span className="field-error">{err}</span>
              </div>
              <div>
                <label className="lbl req" htmlFor="e_degree">ชื่อวุฒิการศึกษา</label>
                <input className="inp" id="e_degree" name="degree" required maxLength={200}
                  placeholder="ศึกษาศาสตรมหาบัณฑิต (ศษ.ม.) สาขา…"
                  value={d.degree} onChange={(ev) => set('degree', ev.target.value)} />
                <span className="field-error"></span>
              </div>
            </div>
            <div className="mb-4">
              <label className="lbl" htmlFor="e_inst">สถาบัน</label>
              <input className="inp" id="e_inst" name="institute" maxLength={200} placeholder="มหาวิทยาลัย…"
                value={d.institute} onChange={(ev) => set('institute', ev.target.value)} />
              <span className="field-error"></span>
            </div>
            <div className="flex items-center gap-3 bg-primary-soft/60 rounded-2xl px-4 py-3">
              <span className="text-lg">🔢</span>
              <label className="text-[12.5px] font-semibold text-ink-soft flex-1" htmlFor="e_sort">
                ลำดับการแสดง <span className="block text-[11px] font-normal text-ink-muted">เลขน้อยแสดงก่อน</span>
              </label>
              <input className="inp !w-24 !py-1.5 text-center" id="e_sort" name="sort_order" type="number"
                value={d.sort_order} onChange={(ev) => set('sort_order', Number(ev.target.value))} />
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
