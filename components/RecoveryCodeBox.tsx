'use client'

import { useState } from 'react'

/**
 * กล่องโชว์รหัสกู้คืน — โชว์ได้ครั้งเดียวเท่านั้น
 * ระบบเก็บไว้แค่ค่าที่ hash แล้ว จึงเปิดดูย้อนหลังไม่ได้ ต้องออกใบใหม่อย่างเดียว
 */
export default function RecoveryCodeBox({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <div className="rounded-2xl border-2 border-sunny/50 bg-sunny-soft/50 p-4 text-left">
      <p className="text-[12.5px] font-extrabold text-ink">🔑 รหัสกู้คืน — เก็บไว้ให้ดี</p>
      <p className="text-[12px] text-ink-soft mt-0.5 leading-relaxed">
        ใช้ตั้งรหัสผ่านใหม่ตอนลืมรหัสผ่าน · <b className="text-coral-deep">หน้านี้โชว์ครั้งเดียว</b> ปิดไปแล้วดูย้อนหลังไม่ได้
      </p>

      <div className="mt-3 flex items-center gap-2">
        <code className="flex-1 bg-white rounded-xl px-3.5 py-2.5 font-mono text-[16px] font-bold tracking-[.12em] text-center select-all break-all">
          {code}
        </code>
        <button type="button" className="btn btn-primary btn-sm shrink-0"
          onClick={() => {
            navigator.clipboard?.writeText(code)
              .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
              .catch(() => {})
          }}>
          {copied ? '✓ คัดลอกแล้ว' : 'คัดลอก'}
        </button>
      </div>

      <p className="text-[11.5px] text-ink-muted mt-2.5 leading-relaxed">
        แนะนำให้บันทึกลงที่ปลอดภัย เช่น โน้ตในมือถือหรือพิมพ์เก็บไว้
        {' '}· ถ้าทำหาย เข้าหลังบ้านแล้วออกใบใหม่ได้ที่หน้า <b className="text-ink">ตั้งค่าระบบ</b>
      </p>
    </div>
  )
}
