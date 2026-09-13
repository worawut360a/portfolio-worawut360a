/**
 * media.ts — ที่เดียวในระบบที่รู้ว่า "รูปกับไฟล์อยู่ที่ไหน และ URL หน้าตายังไง"
 *
 * ทั้งเว็บต้องเรียกผ่านไฟล์นี้เท่านั้น ห้ามประกอบ URL ของ Google เองที่อื่น
 * เพราะ lh3.googleusercontent.com เป็น endpoint ที่ Google ไม่ได้ประกาศรองรับ
 * (Google เคยปิด drive.google.com/uc?export=view มาแล้ว → ตอนนี้คืน 403)
 * ถ้าวันหนึ่งรูปแบบเปลี่ยน แก้แค่ไฟล์นี้ไฟล์เดียว ฐานข้อมูลไม่ต้องแตะ
 */

export type MediaSource = 'drive' | 'static'

/** คู่คอลัมน์ source/ref ที่ใช้ทุกที่ในฐานข้อมูล */
export interface MediaRef {
  /** null ได้ เพราะคอลัมน์ในฐานข้อมูลเป็น NULL ได้เมื่อยังไม่ได้แนบรูป */
  source: MediaSource | null
  /** drive → Google Drive FILE ID · static → path ใต้ /public เช่น 'media/seed/w5_1.jpg' */
  ref: string | null
}

/** ขนาดมาตรฐานที่ใช้ทั้งเว็บ — คุมไว้ที่เดียวเพื่อให้แคชปลายทางทำงานได้ดี */
export const IMG = {
  thumb: 400,
  card: 800,
  full: 1600,
  avatar: 600,
} as const

const PLACEHOLDER = '/media/placeholder.svg'

/* ------------------------------------------------------------------ */
/*  Google Drive                                                       */
/* ------------------------------------------------------------------ */

/**
 * ดึง FILE ID ออกจากสิ่งที่ครูวางมา รองรับทุกรูปแบบที่ Drive ให้มา
 * ครูจะได้ไม่ต้องหา ID เอง — ก๊อบลิงก์แชร์มาแปะได้เลย
 *
 *   https://drive.google.com/file/d/<ID>/view?usp=sharing
 *   https://drive.google.com/open?id=<ID>
 *   https://drive.google.com/uc?export=download&id=<ID>
 *   https://docs.google.com/document/d/<ID>/edit
 *   https://lh3.googleusercontent.com/d/<ID>=w1200
 *   <ID> เปล่า ๆ
 */
export function extractDriveId(input: string): string | null {
  const s = (input ?? '').trim()
  if (!s) return null

  // ID ล้วน — Drive ใช้ [A-Za-z0-9_-] ยาวประมาณ 25–44 ตัว
  if (/^[A-Za-z0-9_-]{25,64}$/.test(s)) return s

  const patterns = [
    /\/d\/([A-Za-z0-9_-]{25,64})/,      // /file/d/<ID>/ · /document/d/<ID>/ · lh3 /d/<ID>
    /[?&]id=([A-Za-z0-9_-]{25,64})/,    // ?id=<ID>
    /\/folders\/([A-Za-z0-9_-]{25,64})/,
  ]
  for (const re of patterns) {
    const m = s.match(re)
    if (m?.[1]) return m[1]
  }
  return null
}

/** URL รูปสำหรับแสดงบนหน้าเว็บ — ใส่ความกว้างเพื่อให้ Google ย่อมาให้ */
export function driveImageUrl(fileId: string, width: number = IMG.card): string {
  return `https://lh3.googleusercontent.com/d/${fileId}=w${width}`
}

/** ลิงก์เปิดไฟล์เอกสาร (PDF ฯลฯ) ในหน้า Drive */
export function driveViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`
}

/** ลิงก์สำหรับฝัง PDF ใน <iframe> */
export function driveEmbedUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`
}

/* ------------------------------------------------------------------ */
/*  ไฟล์นิ่งที่มากับเทมเพลต (/public) — ใช้กับรูปตัวอย่างและ placeholder    */
/* ------------------------------------------------------------------ */

/**
 * บน Netlify ส่งผ่าน Image CDN เพื่อย่อขนาดและแปลงเป็น webp/avif ให้อัตโนมัติ
 * ตอน dev บนเครื่องตัวเองไม่มี CDN จึงคืน path ตรง ๆ
 */
export function staticImageUrl(path: string, width: number = IMG.card): string {
  const clean = '/' + String(path).replace(/^\/+/, '')
  if (process.env.NEXT_PUBLIC_ON_NETLIFY === 'true') {
    return `/.netlify/images?url=${encodeURIComponent(clean)}&w=${width}&fit=cover`
  }
  return clean
}

/* ------------------------------------------------------------------ */
/*  ตัวที่โค้ดทั้งเว็บเรียกใช้จริง                                        */
/* ------------------------------------------------------------------ */

/** URL รูป จากคู่ source/ref ที่อ่านมาจากฐานข้อมูล */
export function imageUrl(m: Partial<MediaRef> | null | undefined, width: number = IMG.card): string {
  if (!m?.ref) return PLACEHOLDER
  return m.source === 'static' ? staticImageUrl(m.ref, width) : driveImageUrl(m.ref, width)
}

/** URL สำหรับกดเปิด/ดาวน์โหลดไฟล์เอกสาร */
export function fileUrl(m: Partial<MediaRef> | null | undefined): string | null {
  if (!m?.ref) return null
  return m.source === 'static' ? '/' + m.ref.replace(/^\/+/, '') : driveViewUrl(m.ref)
}

/** srcset สำหรับรูปที่ต้องคมทั้งจอเล็กจอใหญ่ */
export function imageSrcSet(m: Partial<MediaRef> | null | undefined): string | undefined {
  if (!m?.ref) return undefined
  return [IMG.thumb, IMG.card, IMG.full]
    .map((w) => `${imageUrl(m, w)} ${w}w`)
    .join(', ')
}

/** object-position จากจุดโฟกัสที่ครูตั้งไว้ (แก้ปัญหาครอบตัดแล้วหัวหาย) */
export function focalPosition(x: number | null | undefined, y: number | null | undefined): string {
  const cx = Math.min(100, Math.max(0, x ?? 50))
  const cy = Math.min(100, Math.max(0, y ?? 35))
  return `${cx}% ${cy}%`
}
