import 'server-only'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { randomBytes } from 'node:crypto'
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { db, all, one, scalar, now } from './db'

const COOKIE = 'vpa_session'
const MAX_AGE = 60 * 60 * 8          // 8 ชั่วโมง
const MAX_FAILS = 5                  // ผิดกี่ครั้งถึงล็อก
const LOCK_MINUTES = 15              // ล็อกนานกี่นาที

export interface Session { uid: number; username: string; name: string }

let cachedSecret: Uint8Array | null = null

/**
 * กุญแจเซ็นเซสชัน
 *
 * ลำดับการหา:
 *   1) ตัวแปร AUTH_SECRET (ถ้าตั้งไว้ — เหมาะกับคนที่อยากคุมเอง)
 *   2) ค่าที่เก็บไว้ในฐานข้อมูล
 *   3) ถ้ายังไม่มี สุ่มขึ้นมาใหม่แล้วเก็บลงฐานข้อมูลให้อัตโนมัติ
 *
 * ข้อ 3 มีไว้เพื่อให้คนที่ไม่ถนัดเทคนิคไม่ต้องมานั่งสุ่มค่าเองตอนติดตั้ง
 * เก็บในฐานข้อมูลปลอดภัยพอ ๆ กับข้อมูลอื่นในเว็บ และอยู่ข้ามการ deploy
 */
async function secret(): Promise<Uint8Array> {
  if (cachedSecret) return cachedSecret

  const fromEnv = process.env.AUTH_SECRET
  if (fromEnv && fromEnv.length >= 32) {
    cachedSecret = new TextEncoder().encode(fromEnv)
    return cachedSecret
  }

  let value = await scalar<string>(
    "SELECT value FROM site_settings WHERE key = 'auth_secret'")
  if (!value || value.length < 32) {
    value = randomBytes(32).toString('base64url')
    await db.execute({
      sql: `INSERT INTO site_settings (key, value, updated_at) VALUES ('auth_secret', ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      args: [value, now()],
    })
  }
  cachedSecret = new TextEncoder().encode(value)
  return cachedSecret
}

/* ------------------------------------------------------------------ */
/*  เซสชัน                                                             */
/* ------------------------------------------------------------------ */

export async function createSession(user: Session): Promise<void> {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(await secret())

  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,                                  // JavaScript ในหน้าเว็บอ่านไม่ได้
    secure: process.env.NODE_ENV === 'production',   // ส่งเฉพาะ HTTPS ตอนใช้จริง
    sameSite: 'strict',                              // กัน CSRF
    path: '/',
    maxAge: MAX_AGE,
  })
}

/** อ่านเซสชันปัจจุบัน — คืน null ถ้าไม่มีหรือหมดอายุ */
export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, await secret())
    if (typeof payload.uid !== 'number' || typeof payload.username !== 'string') return null
    return { uid: payload.uid, username: payload.username, name: String(payload.name ?? '') }
  } catch {
    return null   // ลายเซ็นไม่ถูก หรือหมดอายุ
  }
}

/**
 * ด่านตรวจสำหรับหน้าและ Server Action ทุกตัวที่แตะข้อมูล
 *
 * ต้องเรียกใน "ทุก" action ที่เขียนข้อมูล ห้ามเช็กสิทธิ์ฝั่ง React อย่างเดียว
 * เพราะโค้ดหน้าเว็บใครก็ดาวน์โหลดไปอ่านได้ และ Server Action คือ endpoint
 * ที่ยิงตรงเข้ามาได้โดยไม่ต้องผ่านหน้าจอ
 */
export async function requireAdmin(): Promise<Session> {
  const s = await getSession()
  if (!s) redirect('/login')
  return s
}

export async function logout(): Promise<void> {
  (await cookies()).delete(COOKIE)
}

/* ------------------------------------------------------------------ */
/*  ล็อกอิน + กันเดารหัสผ่าน                                            */
/* ------------------------------------------------------------------ */

export async function clientIp(): Promise<string> {
  const h = await headers()
  const fwd = h.get('x-forwarded-for')
  return (fwd ? fwd.split(',')[0]! : h.get('x-real-ip') ?? '').trim() || 'unknown'
}

/** เหลือเวลาโดนล็อกอีกกี่วินาที (0 = ไม่โดนล็อก) */
export async function lockedFor(ip: string): Promise<number> {
  const since = new Date(Date.now() + 7 * 3600_000 - LOCK_MINUTES * 60_000)
    .toISOString().slice(0, 19).replace('T', ' ')
  const rows = await all<{ created_at: string }>(
    `SELECT created_at FROM login_attempts
     WHERE ip = ? AND success = 0 AND created_at > ?
     ORDER BY created_at DESC`, [ip, since])
  if (rows.length < MAX_FAILS) return 0
  const last = new Date(String(rows[0]!.created_at).replace(' ', 'T') + 'Z').getTime()
  const unlockAt = last + LOCK_MINUTES * 60_000
  const nowMs = Date.now() + 7 * 3600_000
  return Math.max(0, Math.ceil((unlockAt - nowMs) / 1000))
}

export interface LoginResult { ok: boolean; error?: string }

export async function attemptLogin(username: string, password: string): Promise<LoginResult> {
  const ip = await clientIp()

  const wait = await lockedFor(ip)
  if (wait > 0) {
    return { ok: false, error: `ลองผิดหลายครั้งเกินไป กรุณารออีก ${Math.ceil(wait / 60)} นาที` }
  }

  const user = await one<{ id: number; username: string; password_hash: string; full_name: string }>(
    'SELECT id, username, password_hash, full_name FROM users WHERE username = ?', [username])

  // เปรียบเทียบเสมอแม้ไม่พบบัญชี เพื่อไม่ให้เดาได้จากเวลาตอบกลับว่ามีชื่อผู้ใช้นี้จริงไหม
  const hash = user?.password_hash ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalid'
  const ok = await bcrypt.compare(password, hash) && !!user

  await db.execute({
    sql: 'INSERT INTO login_attempts (ip, username, success, created_at) VALUES (?, ?, ?, ?)',
    args: [ip, username.slice(0, 60), ok ? 1 : 0, now()],
  })

  if (!ok || !user) return { ok: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }

  await db.execute({
    sql: 'UPDATE users SET last_login_at = ? WHERE id = ?',
    args: [now(), user.id],
  })
  await createSession({ uid: user.id, username: user.username, name: user.full_name })
  return { ok: true }
}

/** บันทึกการกระทำในหลังบ้าน */
export async function logAction(
  action: string, table = '', recordId = 0, detail = '',
): Promise<void> {
  const s = await getSession()
  await db.execute({
    sql: `INSERT INTO activity_log (user_id, action, table_name, record_id, detail, ip, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [s?.uid ?? null, action, table, recordId, detail.slice(0, 400), await clientIp(), now()],
  })
}

export const hashPassword = (plain: string) => bcrypt.hash(plain, 12)
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash)
