'use client'

import Link from 'next/link'
import { useState } from 'react'
import { doRecover } from '@/app/recover/actions'
import { toastSuccess, toastError } from '@/lib/ui'

/** ฟอร์มตั้งรหัสผ่านใหม่ด้วยรหัสกู้คืน */
export default function RecoverForm() {
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  if (done) {
    return (
      <div className="text-center">
        <div className="text-4xl">✅</div>
        <h2 className="mt-2 text-[17px] font-extrabold">ตั้งรหัสผ่านใหม่เรียบร้อย</h2>
        <p className="mt-1.5 text-[12.5px] text-ink-soft leading-relaxed">
          รหัสกู้คืนใบเดิมถูกยกเลิกแล้ว (ใช้ได้ครั้งเดียว)
          <br />เข้าสู่ระบบแล้วอย่าลืมออกใบใหม่ที่หน้า <b className="text-ink">ตั้งค่าระบบ</b>
        </p>
        <Link href="/login" className="btn btn-primary mt-5">เข้าสู่ระบบ</Link>
      </div>
    )
  }

  return (
    <form className="flex flex-col gap-4" action={async (f) => {
      setBusy(true)
      try {
        const r = await doRecover(f)
        if (!r.ok) { setErr(r.error); toastError(r.error); return }
        setErr('')
        toastSuccess('ตั้งรหัสผ่านใหม่เรียบร้อย')
        setDone(true)
      } finally {
        setBusy(false)
      }
    }}>
      <div>
        <label className="lbl req" htmlFor="rc">รหัสกู้คืน</label>
        <input className="inp font-mono tracking-[.1em] uppercase" id="rc" name="code" required
          placeholder="XXXX-XXXX-XXXX" autoComplete="off" spellCheck={false} />
        <span className="field-error">{err}</span>
        <p className="text-[11.5px] text-ink-muted mt-1.5">พิมพ์ขีดกลางหรือไม่พิมพ์ก็ได้ ตัวพิมพ์เล็ก-ใหญ่ไม่มีผล</p>
      </div>

      <div>
        <label className="lbl req" htmlFor="np">รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)</label>
        <input className="inp" id="np" name="new_password" type="password" required minLength={8} autoComplete="new-password" />
        <span className="field-error"></span>
      </div>

      <div>
        <label className="lbl req" htmlFor="cp">ยืนยันรหัสผ่านใหม่</label>
        <input className="inp" id="cp" name="confirm_password" type="password" required minLength={8} autoComplete="new-password" />
        <span className="field-error"></span>
      </div>

      <button type="submit" className="btn btn-primary w-full" disabled={busy}>
        {busy ? 'กำลังตั้งรหัสผ่าน…' : 'ตั้งรหัสผ่านใหม่'}
      </button>
    </form>
  )
}
