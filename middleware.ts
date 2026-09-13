import { NextResponse, type NextRequest } from 'next/server'

/**
 * ด่านแรก — พาคนที่ยังไม่ได้ล็อกอินไปหน้าล็อกอิน
 *
 * ตรงนี้ดูแค่ว่า "มี cookie เซสชันไหม" ไม่ได้ตรวจลายเซ็น
 * เพราะ middleware รันบน edge ซึ่งอ่านฐานข้อมูลเพื่อเอากุญแจมาตรวจไม่ได้
 *
 * นี่ไม่ใช่ระบบความปลอดภัย เป็นแค่ตัวช่วยให้ผู้ใช้ไม่เจอหน้าเปล่า
 * การตรวจจริงอยู่ที่ requireAdmin() ซึ่งตรวจลายเซ็น JWT ฝั่งเซิร์ฟเวอร์
 * และถูกเรียกใน admin/layout.tsx กับ Server Action ทุกตัวที่เขียนข้อมูล
 * คนที่ปลอม cookie จะผ่านด่านนี้ได้ แต่จะโดน requireAdmin() เด้งออกทันที
 */
export function middleware(req: NextRequest) {
  if (req.cookies.get('vpa_session')?.value) return NextResponse.next()

  const url = new URL('/login', req.url)
  url.searchParams.set('next', req.nextUrl.pathname)
  return NextResponse.redirect(url)
}

export const config = { matcher: ['/admin/:path*'] }
