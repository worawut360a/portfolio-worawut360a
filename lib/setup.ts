import 'server-only'
import { db, scalar, now } from './db'
import { hashPassword } from './auth'
import { SCHEMA_SQL, SEED_CORE_SQL, SEED_DEMO_SQL } from './sql-bundle'
import { makeRecoveryCode, saveRecoveryCode } from './recovery'

/**
 * ตัวติดตั้งสำหรับเจ้าของเว็บคนใหม่
 * ใช้ได้เฉพาะตอนที่ยังไม่มีบัญชีผู้ดูแลเท่านั้น (ดู isFresh)
 */

/**
 * แยกคำสั่ง SQL ทีละคำสั่ง
 *
 * - ตัดบรรทัดคอมเมนต์ทิ้งก่อน ไม่งั้นคอมเมนต์หัวไฟล์จะกลืนติดไปกับคำสั่งแรก
 * - ตัด BEGIN/COMMIT/PRAGMA ออก เพราะเราส่งเป็น batch ซึ่งห่อ transaction ให้อยู่แล้ว
 *   ถ้าส่ง BEGIN แยกไปยัง Turso ผ่าน HTTP แต่ละคำสั่งจะเป็นคนละ transaction แล้วพัง
 */
export function splitSql(sql: string): string[] {
  return sql
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !/^(BEGIN|COMMIT|END|PRAGMA)\b/i.test(s))
}

export interface SetupStatus {
  envDb: boolean
  envSecret: boolean
  dbReachable: boolean
  tables: number
  seeded: boolean
  hasUser: boolean
  demoRows: number
  error?: string
}

export async function getStatus(): Promise<SetupStatus> {
  const s: SetupStatus = {
    envDb: !!process.env.TURSO_DATABASE_URL,
    envSecret: true,   // ไม่บังคับแล้ว — ถ้าไม่ตั้ง ระบบสุ่มให้เองแล้วเก็บในฐานข้อมูล
    dbReachable: false, tables: 0, seeded: false, hasUser: false, demoRows: 0,
  }
  if (!s.envDb) return s
  try {
    s.tables = Number(await scalar<number>(
      "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'") ?? 0)
    s.dbReachable = true
  } catch (e) {
    s.error = e instanceof Error ? e.message : String(e)
    return s
  }
  if (s.tables > 0) {
    try {
      s.seeded = Number(await scalar<number>('SELECT COUNT(*) FROM indicators') ?? 0) === 15
      s.hasUser = Number(await scalar<number>('SELECT COUNT(*) FROM users') ?? 0) > 0
      s.demoRows = Number(await scalar<number>('SELECT COUNT(*) FROM works') ?? 0)
    } catch { /* ตารางยังไม่ครบ */ }
  }
  return s
}

/**
 * ยังติดตั้งไม่เสร็จ = ยังไม่มีบัญชีผู้ดูแล
 *
 * ฟังก์ชันนี้ถูกเรียกทุกครั้งที่เปิดหน้าเว็บ (จาก layout ของหน้าบ้าน)
 * เมื่อติดตั้งแล้วจะไม่มีทางกลับไปเป็น "ยังไม่ติดตั้ง" อีก จึงจำผลไว้ได้เลย
 * ประหยัดการวิ่งไปฐานข้อมูล 1 ครั้งต่อการเปิดหน้า 1 ครั้ง
 */
let installedOnce = false

export async function isFresh(): Promise<boolean> {
  if (installedOnce) return false
  try {
    const n = Number(await scalar<number>('SELECT COUNT(*) FROM users') ?? 0)
    if (n > 0) installedOnce = true
    return n === 0
  } catch {
    return true   // ตารางยังไม่มี = ยังไม่ได้ติดตั้งแน่นอน
  }
}

/** รันทั้งไฟล์เป็น transaction เดียว — ถ้าพลาดกลางทางจะย้อนกลับทั้งหมด ไม่ทิ้งข้อมูลค้าง */
async function runScript(sql: string): Promise<number> {
  const stmts = splitSql(sql)
  await db.batch(stmts, 'write')
  return stmts.length
}

export interface InstallOptions {
  username: string
  password: string
  fullName: string
  withDemo: boolean
}

export interface InstallResult { ok: boolean; log: string[]; error?: string; recoveryCode?: string }

export async function install(opts: InstallOptions): Promise<InstallResult> {
  const log: string[] = []
  try {
    if (!(await isFresh())) {
      return { ok: false, log, error: 'ระบบนี้ติดตั้งไปแล้ว — ถ้าลืมรหัสผ่านให้ใช้รหัสกู้คืนที่หน้า /recover' }
    }
    if (opts.username.length < 3) return { ok: false, log, error: 'ชื่อผู้ใช้ต้องยาวอย่างน้อย 3 ตัวอักษร' }
    if (opts.password.length < 8) return { ok: false, log, error: 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร' }

    const status = await getStatus()

    if (status.tables === 0) {
      log.push(`สร้างตารางทั้งหมด (${await runScript(SCHEMA_SQL)} คำสั่ง)`)
    } else {
      log.push(`พบตารางอยู่แล้ว ${status.tables} ตาราง — ข้ามการสร้าง`)
    }

    if (!status.seeded) {
      await runScript(SEED_CORE_SQL)
      log.push('ใส่ข้อมูลตั้งต้น: 3 ด้าน + 15 ตัวชี้วัด ตามเกณฑ์ วPA ว9/2564')
    } else {
      log.push('มีข้อมูลตั้งต้นอยู่แล้ว — ข้าม')
    }

    if (opts.withDemo && status.demoRows === 0) {
      await runScript(SEED_DEMO_SQL)
      log.push('ใส่ข้อมูลตัวอย่าง (ผลงาน ข้อตกลง PA การพัฒนาตนเอง รางวัล) พร้อมรูปถ่ายจริง')
    }

    const t = now()
    await db.execute({
      sql: `INSERT INTO users (username, password_hash, full_name, role, created_at, updated_at)
            VALUES (?, ?, ?, 'admin', ?, ?)`,
      args: [opts.username, await hashPassword(opts.password), opts.fullName || opts.username, t, t],
    })
    log.push('สร้างบัญชีผู้ดูแล (เข้ารหัสด้วย BCRYPT)')

    // ชื่อที่กรอกตอนติดตั้ง ให้ลงในโปรไฟล์ที่แสดงบนเว็บด้วย
    // ไม่งั้นหน้าแรกจะยังขึ้นว่า "ชื่อ–สกุลของคุณครู" ทั้งที่กรอกไปแล้ว
    if (opts.fullName) {
      await db.execute({
        sql: 'UPDATE teacher_profile SET full_name = ?, updated_at = ? WHERE id = 1',
        args: [opts.fullName, t],
      })
      log.push('ตั้งชื่อครูในโปรไฟล์ให้แล้ว')
    }

    // รหัสกู้คืน — โชว์ครั้งเดียวตอนติดตั้งเสร็จ ไว้ใช้ตอนลืมรหัสผ่าน
    const recoveryCode = makeRecoveryCode()
    await saveRecoveryCode(recoveryCode)
    log.push('สร้างรหัสกู้คืนสำหรับกรณีลืมรหัสผ่าน')

    return { ok: true, log, recoveryCode }
  } catch (e) {
    return { ok: false, log, error: e instanceof Error ? e.message : String(e) }
  }
}
