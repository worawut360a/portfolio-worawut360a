'use client'

import { useState } from 'react'
import { imageUrl, focalPosition, IMG, type MediaSource } from '@/lib/media'

/**
 * เลือกจุดโฟกัสของรูปโปรไฟล์
 * รูปจาก Google Drive เราแก้ไฟล์ต้นทางไม่ได้ จึงครอบตัดไม่ได้เหมือนเดิม
 * วิธีนี้ให้ครูคลิกตรงหน้าตัวเองในรูป แล้วเว็บจะเลื่อนกรอบไปตรงนั้นให้ทุกที่
 */
export default function FocalPicker({
  source, refValue, x, y,
}: { source: MediaSource | null; refValue: string | null; x: number; y: number }) {
  const [fx, setFx] = useState(x)
  const [fy, setFy] = useState(y)

  const click = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setFx(Math.round(((e.clientX - r.left) / r.width) * 100))
    setFy(Math.round(((e.clientY - r.top) / r.height) * 100))
  }

  return (
    <div>
      <span className="block text-[12.5px] font-bold text-ink-muted mb-1">จุดโฟกัสของรูป</span>
      <input type="hidden" name="avatar_focus_x" value={fx} />
      <input type="hidden" name="avatar_focus_y" value={fy} />

      {refValue ? (
        <div className="flex gap-4 items-start">
          <div onClick={click}
            className="relative w-[150px] h-[190px] rounded-xl overflow-hidden cursor-crosshair border border-[color:var(--border)] shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl({ source, ref: refValue }, IMG.avatar)} alt=""
              className="w-full h-full object-cover" style={{ objectPosition: focalPosition(fx, fy) }} />
            <span className="absolute w-6 h-6 rounded-full border-2 border-white shadow -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ left: `${fx}%`, top: `${fy}%`, background: 'rgba(29,78,216,.55)' }} />
          </div>
          <div className="text-[12px] text-ink-muted leading-relaxed">
            <p className="font-bold text-ink mb-1">คลิกตรงใบหน้าในรูป</p>
            <p>เว็บจะเลื่อนกรอบไปให้เห็นตรงจุดนั้นในทุกขนาด<br />ทั้งวงกลมเล็กบนหัวเว็บและรูปใหญ่หน้าแรก</p>
            <p className="mt-2 font-mono text-[11px] text-ink-faint">x {fx}% · y {fy}%</p>
            <div className="mt-2 flex gap-2">
              <span className="w-12 h-12 rounded-full overflow-hidden border border-[color:var(--border)] block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl({ source, ref: refValue }, IMG.thumb)} alt="ตัวอย่างวงกลม"
                  className="w-full h-full object-cover" style={{ objectPosition: focalPosition(fx, fy) }} />
              </span>
              <span className="w-20 h-12 rounded-lg overflow-hidden border border-[color:var(--border)] block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl({ source, ref: refValue }, IMG.thumb)} alt="ตัวอย่างสี่เหลี่ยม"
                  className="w-full h-full object-cover" style={{ objectPosition: focalPosition(fx, fy) }} />
              </span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-[12.5px] text-ink-faint p-4 rounded-xl border border-dashed border-[color:var(--border)]">
          แนบรูปก่อน แล้วจะเลือกจุดโฟกัสได้
        </p>
      )}
    </div>
  )
}
