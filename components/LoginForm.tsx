'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { doLogin } from '@/app/login/actions'
import { toastSuccess, toastError } from '@/lib/ui'

/** ฟอร์มเข้าสู่ระบบ — ยกมาจาก login.php (มีปุ่มดูรหัสผ่านและ toast แบบเดียวกัน) */
export default function LoginForm({ next, locked }: { next: string; locked: number }) {
  const router = useRouter()
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <form className="mt-7" noValidate action={async (f) => {
      setBusy(true)
      try {
        const r = await doLogin(f)
        if (!r.ok) { setErr(r.error); toastError(r.error); return }
        setErr('')
        toastSuccess('ยินดีต้อนรับกลับมา ✨')
        setTimeout(() => router.push(r.redirect), 700)
      } finally {
        setBusy(false)
      }
    }}>
      <input type="hidden" name="next" value={next} />

      <div className="mb-4">
        <label className="lbl req" htmlFor="username">ชื่อผู้ใช้</label>
        <input className="inp" id="username" name="username" required autoComplete="username" placeholder="admin" />
        <span className="field-error">{err}</span>
      </div>

      <div className="mb-2">
        <label className="lbl req" htmlFor="password">รหัสผ่าน</label>
        <div className="relative">
          <input className="inp pr-12" id="password" name="password" type={show ? 'text' : 'password'}
            required autoComplete="current-password" placeholder="••••••••" />
          <button type="button" aria-label="แสดงรหัสผ่าน" onClick={() => setShow((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full grid place-items-center text-ink-muted hover:bg-primary-soft transition">
            {show ? '🙈' : '👁️'}
          </button>
        </div>
        <span className="field-error"></span>
      </div>

      <button type="submit" className="btn btn-primary w-full mt-6 !min-h-[52px] text-[15px]" disabled={locked > 0 || busy}>
        {busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ →'}
      </button>

      <p className="mt-4 text-center">
        <Link href="/recover" className="text-[12.5px] text-ink-muted hover:text-primary-deep underline underline-offset-4">
          ลืมรหัสผ่าน?
        </Link>
      </p>
    </form>
  )
}
