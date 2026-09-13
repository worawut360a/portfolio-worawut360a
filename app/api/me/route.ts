import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

/**
 * บอกแค่ว่า "ล็อกอินอยู่ไหม" — ไม่คืนข้อมูลอะไรเลยนอกจาก true/false
 *
 * มีไว้ให้หน้าเว็บสาธารณะโชว์ปุ่มลัดไปหลังบ้านได้ โดยที่หน้ายังถูกแคชไว้ที่ CDN
 * (ถ้าให้หน้าอ่านคุกกี้เองจะกลายเป็น dynamic ทุกหน้า ผู้ชมทั่วไปก็จะช้าลงทั้งเว็บ)
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ ok: !!(await getSession()) }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
