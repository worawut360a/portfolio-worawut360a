'use client'

import { createContext, useContext, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Modal from './Modal'
import { saveDetail } from '@/app/admin/pa/actions'
import { toastSuccess, toastError } from '@/lib/ui'
import type { PaDetail } from '@/lib/types'

export interface IndicatorOpt { id: number; code: string; name: string }
export interface DomainGroup { code: number; name: string; indicators: IndicatorOpt[] }

interface Draft {
  id: number
  indicator_id: number | ''
  task_description: string
  expected_quantity: string
  expected_quality: string
  title: string
}
const EMPTY: Draft = {
  id: 0, indicator_id: '', task_description: '', expected_quantity: '', expected_quality: '',
  title: '➕ เพิ่มข้อตกลงรายตัวชี้วัด',
}

const Ctx = createContext<((d: Draft) => void) | null>(null)

/**
 * โมดัล “ข้อตกลงรายตัวชี้วัด” ของตอนที่ 2 — มีกล่องเดียวเหมือนเว็บ PHP
 * ปุ่มในแต่ละแถวเรียก open() ผ่าน context แล้วเติมค่าลงฟอร์ม
 */
export function PaDetailProvider({
  agreementId, fiscalYear, groups, children,
}: { agreementId: number; fiscalYear: number; groups: DomainGroup[]; children: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [d, setD] = useState<Draft>(EMPTY)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [, startTransition] = useTransition()

  const openWith = (draft: Draft) => { setD(draft); setErr(''); setOpen(true) }

  async function submit(f: FormData) {
    setBusy(true)
    try {
      const r = await saveDetail(f)
      if (!r.ok) { setErr(r.error); toastError(r.error); return }
      toastSuccess('บันทึกตอนที่ 2 สำเร็จ!')
      setOpen(false)
      startTransition(() => router.refresh())
    } finally {
      setBusy(false)
    }
  }

  return (
    <Ctx.Provider value={openWith}>
      {children}

      <Modal open={open} onClose={() => setOpen(false)} title={d.title} maxWidth={680}>
        <form action={submit} autoComplete="off">
          <input type="hidden" name="id" value={d.id} />
          <input type="hidden" name="agreement_id" value={agreementId} />
          <div className="modal-body">
            <p className="text-[12px] text-ink-soft bg-sunny-soft/60 border border-sunny/40 rounded-xl px-3.5 py-2.5 mb-4">
              🔒 รายการนี้จะถูกบันทึกในปีงบประมาณ <b className="text-ink">{fiscalYear}</b> เท่านั้น
            </p>

            <div className="mb-4">
              <label className="lbl req" htmlFor="d_ind">ตัวชี้วัด</label>
              <select className="inp" id="d_ind" name="indicator_id" required
                value={d.indicator_id} onChange={(e) => setD({ ...d, indicator_id: Number(e.target.value) || '' })}>
                <option value="">— เลือกตัวชี้วัด —</option>
                {groups.map((g) => (
                  <optgroup key={g.code} label={`ด้านที่ ${g.code} ${g.name}`}>
                    {g.indicators.map((i) => (
                      <option key={i.id} value={i.id}>{i.code} {i.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <span className="field-error">{err}</span>
            </div>

            <div className="mb-4">
              <label className="lbl req" htmlFor="d_task">งานที่จะปฏิบัติ</label>
              <textarea className="inp" id="d_task" name="task_description" required rows={3}
                value={d.task_description} onChange={(e) => setD({ ...d, task_description: e.target.value })} />
              <span className="field-error"></span>
            </div>

            <div className="mb-4">
              <label className="lbl" htmlFor="d_qty">ผลลัพธ์ที่คาดหวัง — เชิงปริมาณ</label>
              <textarea className="inp" id="d_qty" name="expected_quantity" rows={2} maxLength={400}
                placeholder="เช่น แผนการจัดการเรียนรู้ 20 แผน/ปี"
                value={d.expected_quantity} onChange={(e) => setD({ ...d, expected_quantity: e.target.value })} />
              <span className="field-error"></span>
            </div>

            <div>
              <label className="lbl" htmlFor="d_qual">ผลลัพธ์ที่คาดหวัง — เชิงคุณภาพ</label>
              <textarea className="inp" id="d_qual" name="expected_quality" rows={2} maxLength={400}
                placeholder="เช่น นักเรียนบรรลุจุดประสงค์ ≥ ร้อยละ 80"
                value={d.expected_quality} onChange={(e) => setD({ ...d, expected_quality: e.target.value })} />
              <span className="field-error"></span>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'กำลังบันทึก…' : '💾 บันทึก'}</button>
          </div>
        </form>
      </Modal>
    </Ctx.Provider>
  )
}

const useOpen = () => {
  const fn = useContext(Ctx)
  if (!fn) throw new Error('ต้องอยู่ใน <PaDetailProvider>')
  return fn
}

/** ปุ่ม “+ กรอกข้อตกลง” ของตัวชี้วัดที่ยังว่าง */
export function AddDetailButton({ indicatorId, code }: { indicatorId: number; code: string }) {
  const open = useOpen()
  return (
    <button type="button" className="btn btn-primary btn-sm whitespace-nowrap"
      onClick={() => open({ ...EMPTY, indicator_id: indicatorId, title: `➕ กรอกข้อตกลงตัวชี้วัด ${code}` })}>
      + กรอกข้อตกลง
    </button>
  )
}

/** ปุ่ม ✏️ ของตัวชี้วัดที่กรอกแล้ว */
export function EditDetailButton({ detail, code }: { detail: PaDetail; code: string }) {
  const open = useOpen()
  return (
    <button type="button" className="icon-btn edit w-10 h-10"
      title="แก้ไขข้อตกลงของตัวชี้วัดนี้" aria-label="แก้ไขข้อตกลง"
      onClick={() => open({
        id: detail.id,
        indicator_id: detail.indicator_id,
        task_description: detail.task_description ?? '',
        expected_quantity: detail.expected_quantity ?? '',
        expected_quality: detail.expected_quality ?? '',
        title: `✏️ แก้ไขข้อตกลงตัวชี้วัด ${code}`,
      })}>
      ✏️
    </button>
  )
}
