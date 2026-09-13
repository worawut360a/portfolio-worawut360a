'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin, logAction, hashPassword, verifyPassword } from '@/lib/auth'
import { db, one, now } from '@/lib/db'
import { str } from '@/lib/form'
import { VALID_THEMES, type SiteTheme } from '@/lib/theme'
import { makeRecoveryCode, saveRecoveryCode } from '@/lib/recovery'

export type Result = { ok: true } | { ok: false; error: string }

/** บันทึกธีมสีของทั้งเว็บ — ผู้เข้าชมทุกคนเห็นสีเดียวกัน */
export async function saveTheme(theme: string): Promise<Result> {
  await requireAdmin()
  if (!(VALID_THEMES as readonly string[]).includes(theme)) return { ok: false, error: 'ไม่รู้จักธีมนี้' }

  await db.execute({
    sql: `INSERT INTO site_settings (key, value, updated_at) VALUES ('theme', ?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    args: [theme as SiteTheme, now()],
  })
  await logAction('เปลี่ยนธีมสี', 'site_settings', 0, theme)
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function changePassword(f: FormData): Promise<Result> {
  const session = await requireAdmin()

  const current = str(f, 'current_password', 200)
  const next = str(f, 'new_password', 200)
  const confirm = str(f, 'confirm_password', 200)

  if (next.length < 8) return { ok: false, error: 'รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร' }
  if (next !== confirm) return { ok: false, error: 'รหัสผ่านยืนยันไม่ตรงกัน' }

  const user = await one<{ password_hash: string }>(
    'SELECT password_hash FROM users WHERE id = ?', [session.uid])
  if (!user || !(await verifyPassword(current, user.password_hash)))
    return { ok: false, error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }

  await db.execute({
    sql: 'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
    args: [await hashPassword(next), now(), session.uid],
  })
  await logAction('เปลี่ยนรหัสผ่าน', 'users', session.uid)
  return { ok: true }
}

/**
 * ออกรหัสกู้คืนใบใหม่ — ใบเก่าใช้ไม่ได้ทันที
 * คืนรหัสตัวจริงกลับไปให้โชว์ครั้งเดียว ระบบเก็บไว้แค่ค่าที่ hash แล้ว
 */
export async function newRecoveryCode(): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  const session = await requireAdmin()
  const code = makeRecoveryCode()
  await saveRecoveryCode(code)
  await logAction('ออกรหัสกู้คืนใบใหม่', 'site_settings', session.uid)
  return { ok: true, code }
}
