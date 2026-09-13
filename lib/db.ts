import { createClient, type InValue } from '@libsql/client'
import { isMissingTable } from './db-error'

/**
 * ตัวเชื่อมฐานข้อมูล — ใช้ตัวเดียวกันทั้งตอนพัฒนาและตอนขึ้นจริง
 *   dev      TURSO_DATABASE_URL=file:db/local.sqlite   (ไฟล์ SQLite ธรรมดา)
 *   Netlify  TURSO_DATABASE_URL=libsql://xxx.turso.io + TURSO_AUTH_TOKEN
 */
const url = process.env.TURSO_DATABASE_URL
if (!url) throw new Error('ยังไม่ได้ตั้งค่า TURSO_DATABASE_URL — ดูไฟล์ .env.local')

export const db = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

export type Row = Record<string, unknown>

/**
 * ยังไม่ได้ติดตั้ง = ยังไม่มีตารางในฐานข้อมูล
 *
 * เกิดขึ้นแน่นอน 1 ครั้งกับทุกคนที่ติดตั้งใหม่ เพราะลำดับมันเป็นแบบนี้
 *   deploy (build อ่านฐานข้อมูล)  →  เปิด /setup (ตอนนี้ถึงจะสร้างตาราง)
 * ถ้าปล่อยให้ throw ตอน build จะพังก่อนที่ครูจะได้เปิด /setup ด้วยซ้ำ
 * = ติดตั้งไม่ได้เลยตลอดกาล
 *
 * จึงคืนค่าว่างแทนการโยน error เฉพาะกรณี "ไม่มีตาราง" เท่านั้น (ดู isMissingTable)
 * หน้าเว็บจะ render สภาพว่างแล้วถูกพาไป /setup เอง (ดู app/(site)/layout.tsx)
 * ส่วน error อื่นยังโยนตามปกติ จะได้ไม่กลบปัญหาจริง
 */
let warned = false
function warnOnce() {
  if (warned) return
  warned = true
  console.warn('[db] ยังไม่มีตารางในฐานข้อมูล — ข้ามการอ่านข้อมูลไปก่อน เปิดหน้า /setup เพื่อติดตั้ง')
}

/**
 * คืนทุกแถว
 * ต้องคลายเป็น object ธรรมดาก่อนเสมอ — แถวที่ libSQL คืนมามี prototype ติดมาด้วย
 * ถ้าส่งเข้า Client Component ตรง ๆ React จะฟ้อง "Only plain objects can be passed"
 */
export async function all<T = Row>(sql: string, args: InValue[] = []): Promise<T[]> {
  try {
    const rs = await db.execute({ sql, args })
    return rs.rows.map((r) => ({ ...r })) as unknown as T[]
  } catch (e) {
    if (!isMissingTable(e)) throw e
    warnOnce()
    return []
  }
}

/** คืนแถวแรก หรือ null */
export async function one<T = Row>(sql: string, args: InValue[] = []): Promise<T | null> {
  const rows = await all<T>(sql, args)
  return rows[0] ?? null
}

/** คืนค่าช่องแรกของแถวแรก */
export async function scalar<T = unknown>(sql: string, args: InValue[] = []): Promise<T | null> {
  try {
    const rs = await db.execute({ sql, args })
    const r = rs.rows[0]
    if (!r) return null
    return Object.values(r)[0] as T
  } catch (e) {
    if (!isMissingTable(e)) throw e
    warnOnce()
    return null
  }
}

/** เวลาปัจจุบันแบบไทย ใช้เขียนลง created_at / updated_at เอง (libSQL ไม่มี trigger ให้) */
export function now(): string {
  return new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 19).replace('T', ' ')
}
