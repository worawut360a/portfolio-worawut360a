'use client'

import { createContext, useContext, useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from './Modal'
import type { DomainGroup } from './PaDetailModal'

const Ctx = createContext<(() => void) | null>(null)

/**
 * โมดัล “เลือกตัวชี้วัดก่อนเพิ่มผลงาน” — ยกมาจาก modalPickInd ของ admin/index.php
 * เลือกเสร็จแล้วพาไปหน้าตัวชี้วัดนั้นพร้อมเปิดฟอร์มเพิ่มผลงานทันที
 */
export function PickIndicatorProvider({
  groups, children,
}: { groups: DomainGroup[]; children: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const first = groups.find((g) => g.indicators.length)?.indicators[0]?.id ?? 0
  const [pick, setPick] = useState(first)

  return (
    <Ctx.Provider value={() => setOpen(true)}>
      {children}

      <Modal open={open} onClose={() => setOpen(false)} title="📚 เพิ่มผลงานใหม่" maxWidth={560}>
        <form autoComplete="off" onSubmit={(e) => { e.preventDefault(); router.push(`/admin/indicator/${pick}?new=1`) }}>
          <div className="modal-body">
            <p className="rounded-2xl bg-primary-soft text-primary-deep px-3.5 py-2.5 text-[12.5px] mb-4">
              💡 ผลงานทุกชิ้นต้องอยู่ใต้ตัวชี้วัดตามเกณฑ์ วPA · เลือกตัวชี้วัดที่ผลงานนี้เป็นหลักฐาน
            </p>
            <label className="lbl req" htmlFor="pick_ind">ตัวชี้วัด</label>
            <select className="inp" id="pick_ind" required value={pick} onChange={(e) => setPick(Number(e.target.value))}>
              {groups.map((g) => (
                <optgroup key={g.code} label={`ด้านที่ ${g.code} ${g.name}`}>
                  {g.indicators.map((i) => <option key={i.id} value={i.id}>{i.code} {i.name}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary">ไปกรอกรายละเอียดผลงาน →</button>
          </div>
        </form>
      </Modal>
    </Ctx.Provider>
  )
}

/** ปุ่ม “+ เพิ่มผลงานใหม่” ของแดชบอร์ด — วางกี่จุดก็ได้ ใช้โมดัลกล่องเดียวกัน */
export function PickIndicatorButton({ className, children }: { className: string; children: React.ReactNode }) {
  const open = useContext(Ctx)
  if (!open) throw new Error('ต้องอยู่ใน <PickIndicatorProvider>')
  return <button type="button" className={className} onClick={open}>{children}</button>
}
