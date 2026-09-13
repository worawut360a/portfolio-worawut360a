'use client'

import { useEffect, useState } from 'react'

/**
 * ปุ่มแชร์ — แปลงจากส่วนแชร์ของ work.php
 * ลิงก์แชร์ต้องใช้ที่อยู่หน้าปัจจุบัน จึงประกอบตอนหน้าโหลดเสร็จ
 * (ฝั่งเซิร์ฟเวอร์ไม่รู้โดเมนจริงเมื่อหน้าถูกแคชไว้ล่วงหน้า)
 */
export default function ShareBar() {
  const [url, setUrl] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => { setUrl(window.location.href) }, [])

  const copy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(window.location.href)
      } else {
        // สำรองสำหรับหน้าเว็บที่ไม่ได้เปิดผ่าน HTTPS (clipboard API ใช้ไม่ได้)
        const ta = document.createElement('textarea')
        ta.value = window.location.href
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        ta.remove()
      }
      setMsg('คัดลอกลิงก์แล้ว')
    } catch {
      setMsg('คัดลอกไม่สำเร็จ — กรุณาคัดลอกจากแถบที่อยู่')
    }
    setTimeout(() => setMsg(''), 2600)
  }

  const btn = 'inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur border border-white/30 text-[12.5px] font-bold text-white transition'
  const enc = encodeURIComponent(url)

  return (
    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
      <span className="text-[12px] font-semibold text-white/80 mr-1">แชร์</span>
      <a className={btn} target="_blank" rel="noopener noreferrer"
        href={`https://www.facebook.com/sharer/sharer.php?u=${enc}`}>📘 Facebook</a>
      <a className={btn} target="_blank" rel="noopener noreferrer"
        href={`https://social-plugins.line.me/lineit/share?url=${enc}`}>💬 Line</a>
      <button type="button" onClick={copy}
        className="inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-full bg-white text-ink hover:-translate-y-0.5 shadow-soft text-[12.5px] font-bold transition">
        🔗 คัดลอกลิงก์
      </button>
      {msg && <span className="chip chip-glass !text-ink !text-[11.5px]">{msg}</span>}
    </div>
  )
}
