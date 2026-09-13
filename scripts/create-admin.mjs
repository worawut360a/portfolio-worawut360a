/**
 * สร้างหรือรีเซ็ตบัญชีผู้ดูแล
 *   node scripts/create-admin.mjs <ชื่อผู้ใช้> <รหัสผ่าน> "<ชื่อ-สกุล>"
 * ใช้ได้ทั้งฐานข้อมูลบนเครื่องและ Turso (อ่านค่าจาก .env.local / environment)
 */
import { createClient } from '@libsql/client'
import bcrypt from 'bcryptjs'
import { readFileSync, existsSync } from 'node:fs'

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
}

const [username, password, fullName] = process.argv.slice(2)
if (!username || !password) {
  console.error('ใช้: node scripts/create-admin.mjs <ชื่อผู้ใช้> <รหัสผ่าน> "<ชื่อ-สกุล>"')
  process.exit(1)
}
if (password.length < 8) {
  console.error('รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร')
  process.exit(1)
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})
const hash = await bcrypt.hash(password, 12)
const nowStr = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 19).replace('T', ' ')
const found = await db.execute({ sql: 'SELECT id FROM users WHERE username = ?', args: [username] })

if (found.rows.length) {
  await db.execute({
    sql: 'UPDATE users SET password_hash = ?, full_name = ?, updated_at = ? WHERE username = ?',
    args: [hash, fullName || username, nowStr, username],
  })
  console.log(`อัปเดตรหัสผ่านของ "${username}" เรียบร้อย`)
} else {
  await db.execute({
    sql: `INSERT INTO users (username, password_hash, full_name, role, created_at, updated_at)
          VALUES (?, ?, ?, 'admin', ?, ?)`,
    args: [username, hash, fullName || username, nowStr, nowStr],
  })
  console.log(`สร้างบัญชี "${username}" เรียบร้อย`)
}
