import 'server-only'
import type { MediaSource } from './media'

/** ตัวช่วยอ่านค่าจาก FormData ให้ปลอดภัยและได้ชนิดที่ถูกต้อง */
export const str = (f: FormData, k: string, max = 5000): string =>
  String(f.get(k) ?? '').trim().slice(0, max)

export const int = (f: FormData, k: string, dflt = 0): number => {
  const n = Number(String(f.get(k) ?? '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? Math.trunc(n) : dflt
}

export const num = (f: FormData, k: string, dflt = 0): number => {
  const n = Number(String(f.get(k) ?? '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? n : dflt
}

export const bool = (f: FormData, k: string): number => (f.get(k) ? 1 : 0)

/** วันที่แบบ YYYY-MM-DD หรือ null */
export const date = (f: FormData, k: string): string | null => {
  const v = str(f, k, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null
}

/** เลือกจากรายการที่อนุญาตเท่านั้น — กันค่าที่ไม่ผ่าน CHECK ของฐานข้อมูล */
export const pick = <T extends string>(f: FormData, k: string, allowed: readonly T[], dflt: T): T => {
  const v = String(f.get(k) ?? '')
  return (allowed as readonly string[]).includes(v) ? (v as T) : dflt
}

/** อ่านคู่ <name>_source / <name>_ref ที่ DriveInput ส่งมา */
export function media(f: FormData, name: string): { source: MediaSource | null; ref: string | null } {
  const s = String(f.get(`${name}_source`) ?? '')
  const r = String(f.get(`${name}_ref`) ?? '').trim()
  if (!r || (s !== 'drive' && s !== 'static')) return { source: null, ref: null }
  return { source: s, ref: r }
}

/**
 * สร้าง slug ภาษาไทยให้ใช้ใน URL ได้
 *
 * ต้องเก็บ \p{M} (combining marks) ไว้ด้วย — สระบน-ล่างและวรรณยุกต์ไทย
 * เช่น ู ิ ี ่ ้ นับเป็น Mark ไม่ใช่ Letter ถ้าใช้แค่ \p{L} คำว่า "รูป"
 * จะกลายเป็น "รป" ทำให้ URL อ่านไม่รู้เรื่อง
 */
export function slugify(title: string, fallback = 'work'): string {
  const s = title.toLowerCase().trim()
    .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return s || fallback
}
