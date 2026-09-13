'use client'

import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

/**
 * Toast / confirm / confetti — ยกมาจาก assets/js/app.js ของเว็บ PHP ทั้งชุด
 * หน้าตาและข้อความจึงเหมือนกันทุกจุด
 */

const themeColor = (name = '--primary', fallback = '#0F2A5F') =>
  (typeof window === 'undefined'
    ? fallback
    : getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback)

const Toast = () =>
  Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    didOpen: (t) => {
      t.addEventListener('mouseenter', Swal.stopTimer)
      t.addEventListener('mouseleave', Swal.resumeTimer)
    },
  })

export const toastSuccess = (msg = 'บันทึกสำเร็จ') =>
  Toast().fire({ icon: 'success', title: msg, iconColor: themeColor() })

export const toastError = (msg = 'เกิดข้อผิดพลาด') =>
  Toast().fire({ icon: 'error', title: msg, iconColor: '#C0392B', timer: 3000 })

export const toastInfo = (msg: string) =>
  Toast().fire({ icon: 'info', title: msg, iconColor: '#2F6FDB' })

export const alertError = (msg = 'ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง', title = 'เกิดข้อผิดพลาด') =>
  Swal.fire({ icon: 'error', title, html: msg, confirmButtonText: 'รับทราบ', confirmButtonColor: themeColor() })

const escapeHtml = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

/** ยืนยันการลบ — คืนค่า true/false */
export async function confirmDelete(name = 'รายการนี้', extra = ''): Promise<boolean> {
  const r = await Swal.fire({
    icon: 'warning',
    iconColor: '#E0457B',
    title: 'ยืนยันการลบ?',
    html: `คุณกำลังจะลบ <b style="color:#C0392B">${escapeHtml(name)}</b><br>
           <span style="font-size:.85rem;color:#6B7896">${extra || 'การลบไม่สามารถย้อนกลับได้'}</span>`,
    showCancelButton: true,
    confirmButtonText: '🗑️ ลบเลย',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#C0392B',
    cancelButtonColor: '#E3E8F2',
    customClass: { cancelButton: 'swal-cancel-soft' },
    reverseButtons: true,
    focusCancel: true,
  })
  return r.isConfirmed
}

/** confetti พาสเทลเวลาบันทึกสำเร็จ */
export function fireConfetti(): void {
  const colors = [themeColor(), '#F5C518', '#2F6FDB', '#FFE58A', '#E0457B', '#FFFFFF']
  const box = document.createElement('div')
  box.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden'
  document.body.appendChild(box)
  for (let i = 0; i < 70; i++) {
    const p = document.createElement('i')
    const size = 6 + Math.random() * 8
    p.style.cssText = `position:absolute;top:-20px;left:${Math.random() * 100}%;
      width:${size}px;height:${size * 0.6}px;background:${colors[i % colors.length]};
      border-radius:2px;opacity:${0.7 + Math.random() * 0.3};
      transform:rotate(${Math.random() * 360}deg)`
    box.appendChild(p)
    p.animate(
      [
        { transform: 'translate3d(0,0,0) rotate(0deg)' },
        { transform: `translate3d(${(Math.random() - 0.5) * 260}px, ${window.innerHeight + 60}px, 0) rotate(${720 * (Math.random() > 0.5 ? 1 : -1)}deg)` },
      ],
      { duration: 1800 + Math.random() * 1200, easing: 'cubic-bezier(.2,.6,.4,1)' },
    )
  }
  setTimeout(() => box.remove(), 3200)
}
