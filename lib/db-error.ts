/**
 * ตรวจว่า error ที่ได้แปลว่า "ยังไม่มีตารางในฐานข้อมูล" หรือไม่
 *
 * แยกออกมาเป็นไฟล์เดี่ยวเพราะต้องเทสต์ได้โดยไม่ต้องต่อฐานข้อมูลจริง
 *
 * ข้อความ error ไม่เหมือนกันระหว่างสองที่ที่เว็บนี้รัน
 *   SQLite บนเครื่อง  →  SQLITE_ERROR: no such table: works
 *   Turso ผ่าน HTTP   →  SQLITE_UNKNOWN: SQLite error: no such table: works
 * และบางครั้งข้อความจริงอยู่ใน cause ไม่ใช่ที่ตัว error ชั้นนอก
 * จึงไล่ดูตลอดสาย cause แทนที่จะดูแค่ชั้นเดียว
 */
export function isMissingTable(e: unknown): boolean {
  let cur = e
  for (let depth = 0; cur != null && depth < 5; depth++) {
    const msg = String((cur as { message?: unknown }).message ?? cur)
    if (/no such table/i.test(msg)) return true
    cur = (cur as { cause?: unknown }).cause
  }
  return false
}
