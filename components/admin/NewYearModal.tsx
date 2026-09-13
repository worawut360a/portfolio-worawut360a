'use client'

import { createContext, useContext, useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from './Modal'
import { newYear } from '@/app/admin/pa/actions'
import { toastSuccess, toastError, fireConfetti } from '@/lib/ui'

export interface YearOpt { id: number; fiscal_year: number }

const Ctx = createContext<(() => void) | null>(null)

/**
 * โมดัล “สร้างข้อตกลง PA ปีงบประมาณใหม่” — ยกมาจาก modalNewYear ของ admin/pa.php
 * มีกล่องเดียวต่อหน้าเหมือนเว็บ PHP แล้วให้ปุ่มหลายจุดสั่งเปิดผ่าน context
 */
export function NewYearProvider({
  nextYear, years, autoOpen, children,
}: { nextYear: number; years: YearOpt[]; autoOpen?: boolean; children: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(!!autoOpen)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(f: FormData) {
    setBusy(true)
    try {
      const r = await newYear(f)
      if (!r.ok) { setErr(r.error); toastError(r.error); return }
      fireConfetti()
      toastSuccess(`สร้างข้อตกลงปีงบประมาณ ${f.get('fiscal_year')} สำเร็จ 🎉`)
      setTimeout(() => router.push(`/admin/pa?id=${r.id}`), 900)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Ctx.Provider value={() => { setErr(''); setOpen(true) }}>
      {children}

      <Modal open={open} onClose={() => setOpen(false)} title="📋 สร้างข้อตกลง PA ปีงบประมาณใหม่" maxWidth={520}>
        <form action={submit} autoComplete="off">
          <div className="modal-body">
            <p className="text-[12.5px] text-ink-muted mb-4">ข้อมูลของแต่ละปีงบประมาณแยกจากกันโดยสมบูรณ์</p>
            <div className="mb-4">
              <label className="lbl req" htmlFor="ny_year">ปีงบประมาณ (พ.ศ.)</label>
              <input className="inp" id="ny_year" name="fiscal_year" type="number" required
                min={2500} max={2700} defaultValue={nextYear} />
              <span className="field-error">{err}</span>
            </div>
            <div className="mb-4">
              <label className="lbl" htmlFor="ny_round">รอบการประเมิน</label>
              <select className="inp" id="ny_round" name="round" defaultValue="1">
                <option value="1">รอบที่ 1</option>
                <option value="2">รอบที่ 2</option>
              </select>
            </div>
            <div>
              <label className="lbl" htmlFor="ny_copy">เริ่มจาก</label>
              <select className="inp" id="ny_copy" name="copy_from" defaultValue="0">
                <option value="0">เริ่มจากแบบเปล่า</option>
                {years.map((a) => (
                  <option key={a.id} value={a.id}>คัดลอกโครง 15 ตัวชี้วัดจากปี {a.fiscal_year}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'กำลังสร้าง…' : 'สร้างปีงบประมาณ'}</button>
          </div>
        </form>
      </Modal>
    </Ctx.Provider>
  )
}

/** ปุ่มเปิดโมดัลสร้างปีใหม่ — วางกี่จุดก็ได้ ใช้กล่องเดียวกัน */
export function NewYearButton({ className, children }: { className: string; children: React.ReactNode }) {
  const open = useContext(Ctx)
  if (!open) throw new Error('ต้องอยู่ใน <NewYearProvider>')
  return <button type="button" className={className} onClick={open}>{children}</button>
}
