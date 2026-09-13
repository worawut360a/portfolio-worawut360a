'use client'

import { useState } from 'react'
import { extractDriveId, type MediaSource } from '@/lib/media'

export interface FileRow {
  source: MediaSource
  ref: string
  original_name: string
  mime_type: string
}

/** ไฟล์แนบจาก Drive (PDF เอกสาร ฯลฯ) — เก็บชื่อที่จะโชว์บนเว็บไว้ด้วย */
export default function FileRows({
  name, initial,
}: { name: string; initial: FileRow[] }) {
  const [rows, setRows] = useState<FileRow[]>(initial)
  const [paste, setPaste] = useState('')
  const [title, setTitle] = useState('')

  const add = () => {
    const id = extractDriveId(paste)
    if (!id || !title.trim()) return
    setRows((r) => [...r, { source: 'drive', ref: id, original_name: title.trim(), mime_type: '' }])
    setPaste(''); setTitle('')
  }
  const del = (i: number) => setRows((r) => r.filter((_, k) => k !== i))

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12.5px] font-bold text-ink-muted">ไฟล์แนบ</span>
        <span className="text-[11.5px] text-ink-faint">{rows.length} ไฟล์</span>
      </div>
      <input type="hidden" name={name} value={JSON.stringify(rows)} />

      <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ชื่อไฟล์ที่จะแสดง"
          className="h-11 px-3.5 rounded-xl border border-[color:var(--border)] bg-white text-[14px] focus:outline-none focus:border-[color:var(--primary)]" />
        <input value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="วางลิงก์ Drive"
          className="h-11 px-3.5 rounded-xl border border-[color:var(--border)] bg-white text-[14px] focus:outline-none focus:border-[color:var(--primary)]" />
        <button type="button" onClick={add} disabled={!extractDriveId(paste) || !title.trim()}
          className="btn btn-ghost disabled:opacity-40 disabled:cursor-not-allowed">เพิ่ม</button>
      </div>

      {rows.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {rows.map((r, i) => (
            <li key={`${r.ref}-${i}`} className="flex items-center gap-3 p-2.5 rounded-xl border border-[color:var(--border)] bg-white">
              <span className="w-9 h-9 rounded-lg grid place-items-center shrink-0" style={{ background: 'var(--primary-soft)' }}>📄</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-semibold truncate">{r.original_name}</span>
                <span className="block text-[11px] text-ink-faint font-mono truncate">{r.ref}</span>
              </span>
              <button type="button" onClick={() => del(i)} aria-label="ลบ"
                className="w-8 h-8 rounded-lg border border-[#F0C9C9] text-[#C0392B] shrink-0">✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
