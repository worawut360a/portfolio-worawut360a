'use client'

import { useState } from 'react'
import { extractDriveId, imageUrl, IMG, type MediaSource } from '@/lib/media'

export interface MediaRow {
  source: MediaSource
  ref: string
  caption: string
}

/**
 * รายการรูปหลายรูป — ครูวางลิงก์ Drive ทีละบรรทัด ใส่คำบรรยาย จัดลำดับได้
 * ส่งออกเป็น JSON ในช่องซ่อนช่องเดียว ฝั่งเซิร์ฟเวอร์อ่านแล้วเขียนทับทั้งชุด
 */
export default function MediaRows({
  name, initial, label,
}: { name: string; initial: MediaRow[]; label: string }) {
  const [rows, setRows] = useState<MediaRow[]>(initial)
  const [paste, setPaste] = useState('')

  const add = () => {
    const id = extractDriveId(paste)
    if (!id) return
    setRows((r) => [...r, { source: 'drive', ref: id, caption: '' }])
    setPaste('')
  }
  const del = (i: number) => setRows((r) => r.filter((_, k) => k !== i))
  const move = (i: number, d: number) => setRows((r) => {
    const k = i + d
    if (k < 0 || k >= r.length) return r
    const c = [...r]; const a = c[i]!; c[i] = c[k]!; c[k] = a
    return c
  })
  const caption = (i: number, v: string) =>
    setRows((r) => r.map((row, k) => (k === i ? { ...row, caption: v } : row)))

  const invalid = paste.trim() !== '' && !extractDriveId(paste)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12.5px] font-bold text-ink-muted">{label}</span>
        <span className="text-[11.5px] text-ink-faint">{rows.length} รูป</span>
      </div>
      <input type="hidden" name={name} value={JSON.stringify(rows)} />

      <div className="flex gap-2">
        <input
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="วางลิงก์แชร์จาก Google Drive แล้วกด เพิ่ม"
          className={`flex-1 h-11 px-3.5 rounded-xl border bg-white focus:outline-none text-[14px] ${
            invalid ? 'border-[#E0A0A0]' : 'border-[color:var(--border)] focus:border-[color:var(--primary)]'
          }`}
        />
        <button type="button" onClick={add} disabled={!extractDriveId(paste)}
          className="btn btn-ghost disabled:opacity-40 disabled:cursor-not-allowed">เพิ่ม</button>
      </div>
      {invalid && <p className="text-[11.5px] text-[#C0392B] mt-1">ไม่พบรหัสไฟล์ในลิงก์นี้</p>}

      {rows.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {rows.map((r, i) => (
            <li key={`${r.ref}-${i}`} className="flex items-center gap-3 p-2.5 rounded-xl border border-[color:var(--border)] bg-white">
              <span className="text-[11.5px] text-ink-faint w-5 text-center shrink-0">{i + 1}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl(r, IMG.thumb)} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0 bg-[color:var(--divider)]" />
              <input value={r.caption} onChange={(e) => caption(i, e.target.value)}
                placeholder="คำบรรยายรูป (ไม่ใส่ก็ได้)"
                className="flex-1 h-9 px-3 rounded-lg border border-[color:var(--border)] text-[13px] focus:outline-none focus:border-[color:var(--primary)]" />
              <div className="flex gap-1 shrink-0">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                  aria-label="เลื่อนขึ้น" className="w-8 h-8 rounded-lg border border-[color:var(--border)] disabled:opacity-30">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1}
                  aria-label="เลื่อนลง" className="w-8 h-8 rounded-lg border border-[color:var(--border)] disabled:opacity-30">↓</button>
                <button type="button" onClick={() => del(i)} aria-label="ลบ"
                  className="w-8 h-8 rounded-lg border border-[#F0C9C9] text-[#C0392B]">✕</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
