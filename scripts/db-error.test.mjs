import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isMissingTable } from '../lib/db-error.ts'

/** ข้อความจริงจาก log ของทั้งสองสภาพแวดล้อม */
test('SQLite บนเครื่อง', () => {
  assert.equal(isMissingTable(new Error('SQLITE_ERROR: no such table: self_developments')), true)
})

test('Turso ผ่าน HTTP', () => {
  assert.equal(isMissingTable(new Error('SQLITE_UNKNOWN: SQLite error: no such table: awards')), true)
})

test('ข้อความอยู่ใน cause ชั้นใน', () => {
  const inner = new Error('SQLite error: no such table: works')
  const outer = new Error('SQLITE_UNKNOWN', { cause: inner })
  assert.equal(isMissingTable(outer), true)
})

test('error อื่นต้องไม่ถูกกลบ', () => {
  assert.equal(isMissingTable(new Error('SQLITE_CONSTRAINT: UNIQUE constraint failed')), false)
  assert.equal(isMissingTable(new Error('no such column: foo')), false)
  assert.equal(isMissingTable(new Error('Server returned HTTP status 401')), false)
  assert.equal(isMissingTable(null), false)
  assert.equal(isMissingTable(undefined), false)
})

test('สาย cause วนซ้ำต้องไม่ค้าง', () => {
  const a = new Error('a')
  Object.defineProperty(a, 'cause', { get: () => a })
  assert.equal(isMissingTable(a), false)
})
