/**
 * ตัวติดตั้งแบบบรรทัดคำสั่ง (ทางเลือกแทนหน้า /setup)
 *
 *   npm run setup                       ถามทีละข้อ
 *   npm run setup -- --user=admin --pass=xxxxxxxx --name="ครูสมชาย" --demo
 *                                       รันรวดเดียวไม่ต้องตอบคำถาม (ใช้กับสคริปต์อัตโนมัติ)
 *
 * สร้างตาราง ใส่ข้อมูลตั้งต้น (และข้อมูลตัวอย่างถ้าสั่ง) แล้วสร้างบัญชีผู้ดูแล
 */
import { createClient } from '@libsql/client'
import bcrypt from 'bcryptjs'
import { readFileSync, existsSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { randomBytes } from 'node:crypto'

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
}

// อ่าน --key=value จากบรรทัดคำสั่ง
const argv = Object.fromEntries(process.argv.slice(2).flatMap((a) => {
  const m = a.match(/^--([\w-]+)(?:=(.*))?$/)
  return m ? [[m[1], m[2] ?? 'true']] : []
}))
const nonInteractive = !!(argv.user && argv.pass)

const rl = nonInteractive ? null : createInterface({ input: process.stdin, output: process.stdout })
const ask = async (q, dflt = '') => {
  if (!rl) return dflt
  const a = (await rl.question(dflt ? `${q} [${dflt}] ` : `${q} `)).trim()
  return a || dflt
}
const done = () => { if (rl) rl.close() }
const split = (sql) => sql
  .split('\n').filter((l) => !l.trim().startsWith('--')).join('\n')
  .split(';').map((s) => s.trim())
  .filter((s) => s && !/^(BEGIN|COMMIT|END|PRAGMA)\b/i.test(s))

console.log('\n=== ติดตั้งแฟ้มสะสมผลงานครู วPA ===\n')

const url = process.env.TURSO_DATABASE_URL || await ask('ที่อยู่ฐานข้อมูล:', 'file:db/local.sqlite')
const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })

const q = async (sql) => (await db.execute(sql)).rows[0]?.[0] ?? 0
const tables = Number(await q("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"))

if (tables === 0) {
  const n = split(readFileSync('db/schema.sql', 'utf8'))
  await db.batch(n, 'write')
  console.log(`  ✓ สร้างตารางทั้งหมด (${n.length} คำสั่ง)`)
} else {
  console.log(`  • พบตารางอยู่แล้ว ${tables} ตาราง — ข้าม`)
}

const inds = Number(await q('SELECT COUNT(*) FROM indicators').catch(() => 0))
if (inds !== 15) {
  await db.batch(split(readFileSync('db/seed-core.sql', 'utf8')), 'write')
  console.log('  ✓ ใส่ข้อมูลตั้งต้น: 3 ด้าน + 15 ตัวชี้วัด')
} else {
  console.log('  • มีข้อมูลตั้งต้นอยู่แล้ว — ข้าม')
}

const users = Number(await q('SELECT COUNT(*) FROM users'))
if (users > 0) {
  console.log('\n  ระบบนี้ติดตั้งไปแล้ว ถ้าลืมรหัสผ่านใช้: npm run admin:create -- <user> <pass> "<ชื่อ>"\n')
  done(); process.exit(0)
}

const works = Number(await q('SELECT COUNT(*) FROM works'))
if (works === 0) {
  const demo = nonInteractive
    ? (argv.demo ? 'y' : 'n')
    : (await ask('ใส่ข้อมูลตัวอย่างมาให้ดูก่อนไหม? (y/n)', 'y')).toLowerCase()
  if (demo === 'y') {
    await db.batch(split(readFileSync('db/seed-demo.sql', 'utf8')), 'write')
    console.log('  ✓ ใส่ข้อมูลตัวอย่างแล้ว')
  }
}

console.log('')
const username = argv.user || await ask('ชื่อผู้ใช้สำหรับเข้าหลังบ้าน:', 'admin')
let password = argv.pass || ''
while (password.length < 8) {
  if (nonInteractive) { console.error('  รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร'); done(); process.exit(1) }
  password = await ask('รหัสผ่าน (อย่างน้อย 8 ตัวอักษร):')
  if (password.length < 8) console.log('  รหัสผ่านสั้นเกินไป')
}
const fullName = argv.name || await ask('ชื่อ–สกุลของคุณครู:')

const t = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 19).replace('T', ' ')
await db.execute({
  sql: `INSERT INTO users (username, password_hash, full_name, role, created_at, updated_at)
        VALUES (?, ?, ?, 'admin', ?, ?)`,
  args: [username, await bcrypt.hash(password, 12), fullName || username, t, t],
})
if (fullName) {
  await db.execute({
    sql: 'UPDATE teacher_profile SET full_name = ?, updated_at = ? WHERE id = 1',
    args: [fullName, t],
  })
}
console.log('  ✓ สร้างบัญชีผู้ดูแลแล้ว')

if (!process.env.AUTH_SECRET) {
  console.log('\n  ⚠ ยังไม่ได้ตั้ง AUTH_SECRET — ใส่บรรทัดนี้ลงใน .env.local หรือ Netlify:')
  console.log('    AUTH_SECRET=' + randomBytes(32).toString('base64url'))
}
console.log('\nเสร็จแล้ว — เปิด /login เพื่อเข้าใช้งาน\n')
done()
