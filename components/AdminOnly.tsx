'use client'

import { useEffect, useState } from 'react'

/**
 * แสดงเนื้อหาข้างในเฉพาะตอนที่ครูล็อกอินอยู่ — ใช้กับปุ่มลัดไปหลังบ้าน
 * บนหน้าเว็บสาธารณะ (แทน <?php if (Auth::check()) ?> ของเว็บ PHP)
 *
 * เช็คฝั่งเบราว์เซอร์เพื่อให้หน้ายังถูกแคชที่ CDN ได้ตามเดิม
 * ปุ่มพวกนี้เป็นแค่ทางลัด ไม่ใช่ด่านความปลอดภัย — หน้าหลังบ้านตรวจสิทธิ์เองอยู่แล้ว
 */
export default function AdminOnly({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false)

  useEffect(() => {
    let alive = true
    fetch('/api/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => { if (alive) setOk(!!j.ok) })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  return ok ? <>{children}</> : null
}
