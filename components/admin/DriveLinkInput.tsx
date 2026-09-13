'use client'

import { useState } from 'react'
import { extractDriveId, imageUrl, fileUrl, IMG, type MediaSource } from '@/lib/media'

/**
 * ช่องแนบไฟล์เดี่ยวจาก Google Drive — ครูวางลิงก์แชร์ ระบบดึง FILE ID ให้เอง
 * ส่งออก 2 ช่องเหมือน DriveInput: <name>_source และ <name>_ref
 *
 * ไฟล์ที่มากับเทมเพลต (source = static) เอาลิงก์ Drive มาแทนไม่ได้
 * จึงต้องคงค่าเดิมไว้จนกว่าครูจะกดเปลี่ยนเอง ไม่งั้นแค่เปิดฟอร์มแล้วกดบันทึก
 * ไฟล์เดิมก็หายไปทั้งที่ไม่ได้ตั้งใจ
 */
export default function DriveLinkInput({
  name, id, defaultSource, defaultRef, placeholder = 'วางลิงก์แชร์จาก Google Drive ที่นี่', thumb,
}: {
  name: string; id?: string
  defaultSource?: MediaSource | null; defaultRef?: string | null
  placeholder?: string
  /** โชว์ภาพย่อของไฟล์เดิม — ใช้เมื่อไฟล์นั้นเป็นรูป */
  thumb?: boolean
}) {
  const wasStatic = defaultSource === 'static' && !!defaultRef
  const [raw, setRaw] = useState(wasStatic ? '' : (defaultRef ?? ''))
  const [keepStatic, setKeepStatic] = useState(wasStatic)

  const fileId = extractDriveId(raw)
  const invalid = raw.trim() !== '' && !fileId
  const source: MediaSource | '' = keepStatic ? 'static' : fileId ? 'drive' : ''
  const ref = keepStatic ? (defaultRef ?? '') : (fileId ?? '')

  return (
    <>
      <input type="hidden" name={`${name}_source`} value={source} />
      <input type="hidden" name={`${name}_ref`} value={ref} />

      {keepStatic ? (
        <div className="flex items-center gap-3 p-2.5 rounded-xl border border-[color:var(--border)] bg-white">
          {thumb
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={imageUrl({ source: 'static', ref: defaultRef! }, IMG.thumb)} alt=""
                className="w-16 h-16 rounded-lg object-cover shrink-0" />
            : <span className="w-11 h-11 rounded-xl grad-soft grid place-items-center text-lg shrink-0">📄</span>}
          <span className="min-w-0 flex-1">
            <span className="block text-[12.5px] font-semibold">ใช้ไฟล์ที่มากับเทมเพลต</span>
            <span className="block text-[11.5px] text-ink-faint truncate">{defaultRef}</span>
          </span>
          <a href={fileUrl({ source: 'static', ref: defaultRef! }) ?? '#'} target="_blank" rel="noreferrer"
            className="btn btn-white btn-sm shrink-0">เปิดดู</a>
          <button type="button" onClick={() => setKeepStatic(false)}
            className="chip !text-[11.5px] cursor-pointer shrink-0">เปลี่ยนเป็นลิงก์ Drive</button>
        </div>
      ) : (
        <>
          <input className={`inp${invalid ? ' is-invalid' : ''}`} id={id} value={raw} placeholder={placeholder}
            onChange={(e) => setRaw(e.target.value)} />
          <span className="field-error">
            {invalid ? 'ไม่พบรหัสไฟล์ในลิงก์นี้ — ก๊อบลิงก์จากปุ่ม “แชร์” ใน Google Drive มาวางอีกครั้ง' : ''}
          </span>
          {fileId && (
            <p className="text-[11.5px] text-primary-deep mt-1.5">
              อ่านรหัสไฟล์ได้แล้ว · <span className="font-mono break-all">{fileId}</span>
            </p>
          )}
          {wasStatic && (
            <button type="button" onClick={() => { setKeepStatic(true); setRaw('') }}
              className="text-[11.5px] text-ink-muted underline mt-1.5 cursor-pointer">
              ← กลับไปใช้ไฟล์เดิม
            </button>
          )}
        </>
      )}
    </>
  )
}
