import 'server-only'
import { randomInt } from 'node:crypto'
import { db, one, now } from './db'
import { hashPassword, verifyPassword, lockedFor, clientIp, logAction } from './auth'

/**
 * รหัสกู้คืน — ทางออกเวลาครูลืมรหัสผ่าน โดยไม่ต้องพิมพ์คำสั่งใด ๆ
 *
 * ระบบนี้มีบัญชีเดียวและไม่มีบริการส่งอีเมล (ต้องฟรีทั้งหมด) จึงใช้วิธีให้รหัสยาว ๆ
 * ไว้ตั้งแต่ตอนติดตั้ง เก็บในระบบเป็นค่าที่ hash แล้วเหมือนรหัสผ่าน
 * ใครขโมยฐานข้อมูลไปก็ย้อนกลับเป็นรหัสจริงไม่ได้
 */

const KEY = 'recovery_hash'

// ตัดอักษรที่สับสนออก: 0/O, 1/I/L — ครูต้องคัดลอกหรือจดด้วยมือ
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** รหัสรูปแบบ XXXX-XXXX-XXXX (12 ตัว ≈ 59 บิต) เดาสุ่มไม่ไหวแม้ไม่มีระบบล็อก */
export function makeRecoveryCode(): string {
  const pick = () => ALPHABET[randomInt(ALPHABET.length)]
  const group = () => Array.from({ length: 4 }, pick).join('')
  return `${group()}-${group()}-${group()}`
}

const normalize = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '')

/** เก็บรหัสกู้คืน (เก็บเฉพาะค่าที่ hash แล้ว) */
export async function saveRecoveryCode(code: string): Promise<void> {
  await db.execute({
    sql: `INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    args: [KEY, await hashPassword(normalize(code)), now()],
  })
}

export async function hasRecoveryCode(): Promise<boolean> {
  const row = await one<{ value: string }>('SELECT value FROM site_settings WHERE key = ?', [KEY])
  return !!row?.value
}

export type RecoverResult = { ok: true } | { ok: false; error: string }

/**
 * ใช้รหัสกู้คืนตั้งรหัสผ่านใหม่
 * นับความพยายามรวมกับการล็อกอินปกติ — ผิด 5 ครั้งใน 15 นาทีก็โดนล็อกเหมือนกัน
 * ไม่งั้นจะกลายเป็นประตูหลังที่ยิงเดารหัสได้ไม่จำกัด
 */
export async function recoverPassword(code: string, newPassword: string): Promise<RecoverResult> {
  const ip = await clientIp()

  const wait = await lockedFor(ip)
  if (wait > 0) return { ok: false, error: `ลองผิดหลายครั้งเกินไป กรุณารออีก ${Math.ceil(wait / 60)} นาที` }

  if (newPassword.length < 8) return { ok: false, error: 'รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร' }

  const row = await one<{ value: string }>('SELECT value FROM site_settings WHERE key = ?', [KEY])
  const stored = row?.value ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalid'
  const ok = (await verifyPassword(normalize(code), stored)) && !!row?.value

  await db.execute({
    sql: 'INSERT INTO login_attempts (ip, username, success, created_at) VALUES (?, ?, ?, ?)',
    args: [ip, 'recovery', ok ? 1 : 0, now()],
  })

  if (!ok) return { ok: false, error: 'รหัสกู้คืนไม่ถูกต้อง' }

  const user = await one<{ id: number }>('SELECT id FROM users ORDER BY id LIMIT 1')
  if (!user) return { ok: false, error: 'ยังไม่มีบัญชีผู้ดูแลในระบบ' }

  await db.execute({
    sql: 'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
    args: [await hashPassword(newPassword), now(), user.id],
  })

  // รหัสกู้คืนใช้ได้ครั้งเดียว — ใช้แล้วต้องออกใบใหม่ ไม่งั้นใบที่หลุดไปยังใช้ซ้ำได้ตลอด
  await db.execute({ sql: 'DELETE FROM site_settings WHERE key = ?', args: [KEY] })
  await logAction('กู้คืนรหัสผ่านด้วยรหัสกู้คืน', 'users', user.id)

  return { ok: true }
}
