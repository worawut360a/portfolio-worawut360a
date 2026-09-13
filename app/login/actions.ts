'use server'

import { attemptLogin, lockedFor, clientIp } from '@/lib/auth'

export type LoginOut = { ok: true; redirect: string } | { ok: false; error: string }

export async function doLogin(f: FormData): Promise<LoginOut> {
  const username = String(f.get('username') ?? '').trim()
  const password = String(f.get('password') ?? '')
  const next = String(f.get('next') ?? '')

  if (!username || !password) return { ok: false, error: 'กรอกให้ครบทั้งสองช่อง' }

  const res = await attemptLogin(username, password)
  if (!res.ok) return { ok: false, error: res.error ?? 'เข้าสู่ระบบไม่สำเร็จ' }

  // กัน open redirect: รับเฉพาะ path ภายในเว็บเท่านั้น
  const safe = next.startsWith('/admin') ? next : '/admin'
  return { ok: true, redirect: safe }
}

/** เหลือเวลาล็อกกี่วินาที — ใช้โชว์คำเตือนและปิดปุ่มตอนโหลดหน้า */
export async function lockSeconds(): Promise<number> {
  return lockedFor(await clientIp())
}
