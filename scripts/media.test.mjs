import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// แปลง media.ts เป็น JS แบบง่าย ๆ (ตัด type annotation) เพื่อทดสอบโดยไม่ต้องมี build step
const src = readFileSync(new URL('../lib/media.ts', import.meta.url), 'utf8')
const js = src
  .replace(/^export type[\s\S]*?\n\n/m, '')
  .replace(/^export interface[\s\S]*?^}\n/m, '')
  .replace(/:\s*(string|number|boolean)\s*\|\s*null\s*\|\s*undefined/g, '')
  .replace(/:\s*Partial<MediaRef>\s*\|\s*null\s*\|\s*undefined/g, '')
  .replace(/:\s*string\s*\|\s*null/g, '').replace(/:\s*string\s*\|\s*undefined/g, '')
  .replace(/:\s*number\s*\|\s*null\s*\|\s*undefined/g, '')
  .replace(/:\s*(string|number|boolean|void)\b/g, '')
  .replace(/ as const/g, '')
const mod = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))
const { extractDriveId, driveImageUrl, imageUrl, fileUrl, focalPosition } = mod

const ID = '1a2B3c4D5e6F7g8H9i0JkLmNoPqRsTuVw'

test('รับลิงก์แชร์แบบปกติ', () => {
  assert.equal(extractDriveId(`https://drive.google.com/file/d/${ID}/view?usp=sharing`), ID)
})
test('รับลิงก์แบบ open?id=', () => {
  assert.equal(extractDriveId(`https://drive.google.com/open?id=${ID}`), ID)
})
test('รับลิงก์แบบ uc?export=download', () => {
  assert.equal(extractDriveId(`https://drive.google.com/uc?export=download&id=${ID}`), ID)
})
test('รับลิงก์ Google Docs', () => {
  assert.equal(extractDriveId(`https://docs.google.com/document/d/${ID}/edit`), ID)
})
test('รับ URL lh3 ที่ประกอบไปแล้ว (วนกลับมาได้)', () => {
  assert.equal(extractDriveId(driveImageUrl(ID, 800)), ID)
})
test('รับ ID เปล่า ๆ', () => {
  assert.equal(extractDriveId(ID), ID)
})
test('ตัดช่องว่างหัวท้ายให้', () => {
  assert.equal(extractDriveId(`  ${ID}  `), ID)
})
test('ค่าที่ใช้ไม่ได้ต้องได้ null', () => {
  for (const bad of ['', '   ', 'https://example.com/a.jpg', 'abc', 'https://drive.google.com/']) {
    assert.equal(extractDriveId(bad), null, `ควรเป็น null: ${bad}`)
  }
})
test('รูปจาก drive ประกอบ URL ถูกต้องพร้อมขนาด', () => {
  assert.equal(imageUrl({ source: 'drive', ref: ID }, 400),
    `https://lh3.googleusercontent.com/d/${ID}=w400`)
})
test('รูป static ตอน dev คืน path ตรง ๆ', () => {
  assert.equal(imageUrl({ source: 'static', ref: 'media/seed/w5_1.jpg' }, 800), '/media/seed/w5_1.jpg')
})
test('ไม่มีรูป → placeholder ไม่ใช่ค่าว่าง', () => {
  assert.equal(imageUrl(null), '/media/placeholder.svg')
  assert.equal(imageUrl({ source: 'drive', ref: null }), '/media/placeholder.svg')
})
test('ไฟล์เอกสารจาก drive เปิดหน้า view', () => {
  assert.equal(fileUrl({ source: 'drive', ref: ID }), `https://drive.google.com/file/d/${ID}/view`)
})
test('จุดโฟกัสถูกบีบให้อยู่ในช่วง 0–100 เสมอ', () => {
  assert.equal(focalPosition(50, 35), '50% 35%')
  assert.equal(focalPosition(-20, 900), '0% 100%')
  assert.equal(focalPosition(null, undefined), '50% 35%')
})
