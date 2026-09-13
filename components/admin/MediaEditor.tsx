'use client'

import { useRef, useState } from 'react'
import { extractDriveId, imageUrl, fileUrl, IMG, type MediaSource } from '@/lib/media'
import { toastSuccess } from '@/lib/ui'

export interface ImageRow { id?: number; source: MediaSource; ref: string; caption: string }
export interface FileRow { id?: number; source: MediaSource; ref: string; original_name: string }

/* ------------------------------------------------------------------ */
/*  รูปภาพ — ลากที่ ⠿ เพื่อจัดลำดับ · รูปแรก = ภาพปก                    */
/* ------------------------------------------------------------------ */

export function ImageSection({
  rows, onChange, label, hint, coverBadge = false,
}: {
  rows: ImageRow[]
  onChange: (r: ImageRow[]) => void
  label: string
  hint: string
  /** ติดป้าย “ปก” ที่รูปแรก — ใช้เฉพาะผลงาน ที่รูปแรกกลายเป็นภาพปกจริง ๆ */
  coverBadge?: boolean
}) {
  const [paste, setPaste] = useState('')
  const [drag, setDrag] = useState<number | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const id = extractDriveId(paste)
  const invalid = paste.trim() !== '' && !id

  const add = () => {
    if (!id) return
    onChange([...rows, { source: 'drive' as MediaSource, ref: id, caption: '' }])
    setPaste('')
  }

  /**
   * ลากจัดลำดับด้วย pointer event (ไม่ใช่ HTML5 drag-and-drop)
   * เพราะแบบ pointer ใช้ได้ทั้งเมาส์และนิ้วบนมือถือ ส่วน drag-and-drop ของ HTML ไม่รองรับการแตะ
   */
  function startDrag(from: number, e: React.PointerEvent) {
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    setDrag(from)
    let cur = from

    const move = (ev: PointerEvent) => {
      const kids = Array.from(box.current?.children ?? []) as HTMLElement[]
      const over = kids.findIndex((k) => {
        const r = k.getBoundingClientRect()
        return ev.clientY >= r.top && ev.clientY <= r.bottom
      })
      if (over < 0 || over === cur) return
      const c = [...rowsRef.current]
      const [item] = c.splice(cur, 1)
      c.splice(over, 0, item!)
      cur = over
      setDrag(over)
      onChange(c)
    }
    const up = () => {
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerup', up)
      setDrag(null)
      if (cur !== from) toastSuccess('จัดลำดับรูปภาพเรียบร้อย · รูปแรกเป็นภาพปก')
    }
    document.addEventListener('pointermove', move)
    document.addEventListener('pointerup', up)
  }

  // ให้ตัวจัดการ pointermove เห็นลำดับล่าสุดเสมอ (closure จับค่าเก่าไว้ไม่ได้)
  const rowsRef = useRef(rows)
  rowsRef.current = rows

  return (
    <div className="mb-5">
      <span className="lbl">{label}</span>

      <div className="dropzone">
        <div className="text-4xl float">🖼️</div>
        <p className="text-[13.5px] font-bold mt-1">วางลิงก์แชร์รูปจาก Google Drive แล้วกดเพิ่ม</p>
        <p className="text-[11.5px] text-ink-muted mt-0.5">{hint}</p>
        <div className="mt-3 flex gap-2 max-w-[520px] mx-auto">
          <input value={paste} onChange={(e) => setPaste(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
            placeholder="https://drive.google.com/file/d/…/view"
            className={`inp !py-2 !text-[12.5px]${invalid ? ' is-invalid' : ''}`} />
          <button type="button" className="btn btn-primary btn-sm shrink-0" onClick={add} disabled={!id}>+ เพิ่มรูป</button>
        </div>
        {invalid && <p className="text-[11.5px] text-coral-deep mt-2">ไม่พบรหัสไฟล์ในลิงก์นี้ — ก๊อบลิงก์จากปุ่ม “แชร์” ใน Google Drive มาวางอีกครั้ง</p>}
      </div>

      <div className="mt-4">
        <h4 className="font-bold text-[14px] mb-2 flex flex-wrap items-baseline gap-x-2">
          🖼️ รูปภาพในรายการนี้
          <span className="text-[11.5px] font-normal text-ink-muted">
            (ลากที่ ⠿ เพื่อจัดลำดับ{coverBadge ? ' · รูปแรก = ภาพปก' : ''})
          </span>
        </h4>
        <div ref={box}>
          {rows.length === 0
            ? <p className="text-[12.5px] text-ink-muted">ยังไม่มีรูปภาพ</p>
            : rows.map((img, i) => (
              <div key={`${img.ref}-${i}`} className={`img-row${drag === i ? ' sortable-ghost' : ''}`}>
                <span onPointerDown={(e) => startDrag(i, e)}
                  className="cursor-grab select-none touch-none w-8 h-8 rounded-lg bg-[color:var(--divider)] grid place-items-center text-ink-faint text-lg shrink-0"
                  title="ลากเพื่อจัดลำดับ">⠿</span>
                <span className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl(img, IMG.thumb)} alt=""
                    className="w-16 h-12 object-cover rounded-xl border border-[color:var(--border)]" />
                  {coverBadge && i === 0 && <span className="absolute -top-1.5 -left-1.5 chip chip-grad !px-1.5 !py-0.5 !text-[9px]">ปก</span>}
                </span>
                <input className="inp !py-1.5 !text-[12px] !min-h-[38px] flex-1" placeholder="คำบรรยายภาพ (alt)"
                  value={img.caption}
                  onChange={(e) => onChange(rows.map((r, k) => (k === i ? { ...r, caption: e.target.value } : r)))} />
                <button type="button" className="icon-btn del shrink-0" title="ลบรูปนี้" aria-label="ลบรูปนี้"
                  onClick={() => onChange(rows.filter((_, k) => k !== i))}>🗑️</button>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  ไฟล์แนบ                                                            */
/* ------------------------------------------------------------------ */

export function FileSection({ rows, onChange, label }: { rows: FileRow[]; onChange: (r: FileRow[]) => void; label: string }) {
  const [paste, setPaste] = useState('')
  const [name, setName] = useState('')
  const id = extractDriveId(paste)
  const ready = !!id && name.trim() !== ''

  const add = () => {
    if (!ready) return
    onChange([...rows, { source: 'drive' as MediaSource, ref: id!, original_name: name.trim() }])
    setPaste(''); setName('')
  }

  return (
    <div className="mb-2">
      <span className="lbl">{label}</span>

      <div className="dropzone !py-5">
        <div className="text-3xl">📎</div>
        <p className="text-[13.5px] font-bold mt-1">วางลิงก์แชร์ไฟล์จาก Google Drive แล้วกดเพิ่ม</p>
        <div className="mt-3 grid sm:grid-cols-[1fr_1fr_auto] gap-2 max-w-[620px] mx-auto">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อไฟล์ที่จะแสดง"
            className="inp !py-2 !text-[12.5px]" />
          <input value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="วางลิงก์ Drive"
            className="inp !py-2 !text-[12.5px]" />
          <button type="button" className="btn btn-primary btn-sm shrink-0" onClick={add} disabled={!ready}>+ เพิ่มไฟล์</button>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="font-bold text-[14px] mb-2">📎 ไฟล์แนบในรายการนี้</h4>
        {rows.length === 0
          ? <p className="text-[12.5px] text-ink-muted">ยังไม่มีไฟล์แนบ</p>
          : rows.map((f, i) => (
            <div key={`${f.ref}-${i}`} className="img-row !cursor-default">
              <span className="w-10 h-10 rounded-xl grad-soft grid place-items-center text-lg shrink-0">📄</span>
              <a href={fileUrl(f) ?? '#'} target="_blank" rel="noreferrer"
                className="flex-1 min-w-0 text-[12.5px] font-bold truncate hover:text-primary-deep">{f.original_name}</a>
              <span className="chip chip-glass !text-[10.5px] shrink-0">Drive</span>
              <button type="button" className="icon-btn del shrink-0" title="ลบไฟล์" aria-label="ลบไฟล์"
                onClick={() => onChange(rows.filter((_, k) => k !== i))}>🗑️</button>
            </div>
          ))}
      </div>
    </div>
  )
}
