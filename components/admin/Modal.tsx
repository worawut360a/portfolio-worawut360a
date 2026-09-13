'use client'

import { useEffect } from 'react'

/**
 * หน้าต่างซ้อน (modal) — ใช้คลาส .modal-* ชุดเดียวกับเว็บ PHP
 * กล่องอยู่ใน DOM ตลอด แล้วสลับคลาส .open ที่พื้นหลัง เพื่อให้ transition
 * ของ .modal-backdrop.open .modal-box ทำงานเหมือนเดิม
 *
 * ปิดได้ 3 ทาง: ปุ่ม ✕ · คลิกพื้นหลัง · ปุ่ม Esc
 */
export default function Modal({
  open, onClose, title, maxWidth = 800, children,
}: {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  maxWidth?: number
  children: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', esc)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', esc)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  return (
    <div className={`modal-backdrop${open ? ' open' : ''}`} aria-hidden={!open} role="dialog" aria-modal="true"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" style={{ maxWidth: `${maxWidth}px` }}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button type="button" className="modal-x" onClick={onClose} aria-label="ปิด">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
