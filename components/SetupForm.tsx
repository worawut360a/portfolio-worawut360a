'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Field, inputClass } from '@/components/admin/Field'
import RecoveryCodeBox from '@/components/RecoveryCodeBox'
import { doInstall, finishSetup } from '@/app/setup/actions'

/**
 * ฟอร์มติดตั้ง — ไม่ใช้ redirect เพราะต้องโชว์รหัสกู้คืนที่ได้กลับมา
 * ถ้า redirect รหัสจะต้องเดินทางผ่าน URL ซึ่งไปโผล่ในประวัติเบราว์เซอร์และ log ของเซิร์ฟเวอร์
 */
export default function SetupForm() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [leaving, setLeaving] = useState(false)

  /** ล้างแคชก่อนออกจากหน้านี้ ไม่งั้นหน้าเว็บที่สร้างไว้ตอนยังไม่มีตารางจะยังเด้งกลับมา /setup */
  const go = async (href: string) => {
    setLeaving(true)
    try { await finishSetup() } catch { /* ล้างแคชไม่สำเร็จก็ยังไปต่อได้ */ }
    router.push(href)
  }
  const [err, setErr] = useState('')
  const [done, setDone] = useState<{ code?: string; log: string[] } | null>(null)

  if (done) {
    return (
      <div className="text-center">
        <div className="text-4xl">🎉</div>
        <h2 className="mt-2 text-[20px] font-extrabold">ติดตั้งเรียบร้อยแล้ว</h2>
        <p className="mt-1 text-[13px] text-ink-soft">หน้าติดตั้งปิดตัวเองแล้ว เข้าอีกไม่ได้</p>

        <ul className="mt-4 text-left text-[12.5px] text-ink-soft flex flex-col gap-1">
          {done.log.map((l) => <li key={l}>✓ {l}</li>)}
        </ul>

        {done.code && <div className="mt-5"><RecoveryCodeBox code={done.code} /></div>}

        <div className="mt-5 flex gap-3 justify-center">
          <button type="button" className="btn btn-primary" disabled={leaving}
            onClick={() => void go('/login')}>{leaving ? 'กำลังไป…' : 'เข้าสู่ระบบ'}</button>
          <button type="button" className="btn btn-ghost" disabled={leaving}
            onClick={() => void go('/')}>ดูหน้าเว็บ</button>
        </div>
      </div>
    )
  }

  return (
    <form className="flex flex-col gap-4" action={async (f) => {
      setBusy(true)
      try {
        const r = await doInstall(f)
        if (!r.ok) { setErr(r.error ?? 'ติดตั้งไม่สำเร็จ'); return }
        setErr('')
        setDone({ code: r.recoveryCode, log: r.log })
      } finally {
        setBusy(false)
      }
    }}>
      <h2 className="font-extrabold text-[15px]">สร้างบัญชีผู้ดูแล</h2>

      {err && (
        <p className="rounded-xl px-4 py-2.5 text-[13px] font-semibold bg-[#FDECEC] text-[#B3261E] border border-[#F5C2C0]">{err}</p>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="ชื่อผู้ใช้" required hint="ใช้เข้าระบบหลังบ้าน">
          <input name="username" required minLength={3} defaultValue="admin" autoComplete="username" className={inputClass} />
        </Field>
        <Field label="รหัสผ่าน" required hint="อย่างน้อย 8 ตัวอักษร">
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
        </Field>
      </div>
      <Field label="ชื่อ–สกุลของคุณครู" required>
        <input name="full_name" required className={inputClass} />
      </Field>

      <label className="flex items-start gap-2.5 p-3.5 rounded-xl border border-[color:var(--border)] cursor-pointer">
        <input type="checkbox" name="demo" value="1" defaultChecked className="w-4 h-4 mt-0.5 accent-[color:var(--primary)]" />
        <span className="text-[13.5px]">
          ใส่ข้อมูลตัวอย่างมาให้ดูก่อน
          <span className="block text-[12px] text-ink-faint">
            ผลงาน 30 ชิ้น ข้อตกลง PA 3 ปี พร้อมรูปถ่ายจริง — ลบทิ้งทีหลังได้ในหน้าหลังบ้าน
          </span>
        </span>
      </label>

      <button type="submit" className="btn btn-primary w-full" disabled={busy}>
        {busy ? 'กำลังติดตั้ง…' : 'ติดตั้งระบบ'}
      </button>
    </form>
  )
}
