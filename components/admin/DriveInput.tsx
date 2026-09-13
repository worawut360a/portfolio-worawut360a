'use client'

import { useState } from 'react'
import { extractDriveId, imageUrl, IMG, type MediaSource } from '@/lib/media'

/**
 * ช่องแนบรูปจาก Google Drive
 * ครูก๊อบ "ลิงก์แชร์" มาวางได้เลย ระบบดึง FILE ID ให้เอง แล้วโชว์ตัวอย่างทันที
 * ส่งค่าออกเป็น 2 ช่อง: <name>_source และ <name>_ref (ตรงกับคอลัมน์ในฐานข้อมูล)
 */
export default function DriveInput({
  name, label, defaultSource, defaultRef, hint,
}: {
  name: string; label: string
  defaultSource?: MediaSource | null; defaultRef?: string | null; hint?: string
}) {
  const wasStatic = defaultSource === 'static' && !!defaultRef
  const [raw, setRaw] = useState(wasStatic ? '' : (defaultRef ?? ''))
  const [keepStatic, setKeepStatic] = useState(wasStatic)

  const id = extractDriveId(raw)
  const source: MediaSource | '' = keepStatic ? 'static' : id ? 'drive' : ''
  const ref = keepStatic ? (defaultRef ?? '') : (id ?? '')
  const invalid = raw.trim() !== '' && !id

  return (
    <div>
      <span className="block text-[12.5px] font-bold text-ink-muted mb-1">{label}</span>

      <input type="hidden" name={`${name}_source`} value={source} />
      <input type="hidden" name={`${name}_ref`} value={ref} />

      {keepStatic ? (
        <div className="flex items-center gap-3 p-2.5 rounded-xl border border-[color:var(--border)] bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl({ source: 'static', ref: defaultRef! }, IMG.thumb)} alt=""
            className="w-16 h-16 rounded-lg object-cover shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold">ใช้รูปที่มากับเทมเพลต</p>
            <p className="text-[11.5px] text-ink-faint truncate">{defaultRef}</p>
          </div>
          <button type="button" onClick={() => setKeepStatic(false)}
            className="chip !text-[11.5px] cursor-pointer shrink-0">เปลี่ยนเป็นลิงก์ Drive</button>
        </div>
      ) : (
        <>
          <input
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="วางลิงก์แชร์จาก Google Drive ที่นี่"
            className={`w-full h-11 px-3.5 rounded-xl border bg-white focus:outline-none text-[14px] ${
              invalid ? 'border-[#E0A0A0] focus:border-[#C0392B]' : 'border-[color:var(--border)] focus:border-[color:var(--primary)]'
            }`}
          />
          {invalid && (
            <p className="text-[11.5px] text-[#C0392B] mt-1">
              ไม่พบรหัสไฟล์ในลิงก์นี้ — ก๊อบลิงก์จากปุ่ม “แชร์” ใน Google Drive มาวางอีกครั้ง
            </p>
          )}
          {id && (
            <div className="mt-2 flex items-center gap-3 p-2.5 rounded-xl border border-[color:var(--primary-line)]"
                 style={{ background: 'var(--primary-soft)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl({ source: 'drive', ref: id }, IMG.thumb)} alt="ตัวอย่างรูป"
                className="w-16 h-16 rounded-lg object-cover bg-white shrink-0" />
              <div className="min-w-0">
                <p className="text-[12.5px] font-semibold text-primary-deep">อ่านรหัสไฟล์ได้แล้ว</p>
                <p className="text-[11px] text-ink-muted font-mono break-all">{id}</p>
              </div>
            </div>
          )}
          {wasStatic && (
            <button type="button" onClick={() => { setKeepStatic(true); setRaw('') }}
              className="text-[11.5px] text-ink-muted underline mt-1.5 cursor-pointer">
              ← กลับไปใช้รูปเดิม
            </button>
          )}
        </>
      )}

      <p className="text-[11.5px] text-ink-faint mt-1.5">
        {hint ?? 'ตั้งค่าไฟล์ใน Drive เป็น “ทุกคนที่มีลิงก์” ก่อน ไม่งั้นรูปจะไม่ขึ้นบนเว็บ'}
      </p>
    </div>
  )
}
