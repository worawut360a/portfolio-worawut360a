'use client'

import { useState } from 'react'

/** ปุ่มลบที่ต้องยืนยันก่อนเสมอ — กันกดพลาด */
export default function DeleteButton({
  action, label, confirmText,
}: { action: () => Promise<void>; label: string; confirmText: string }) {
  const [asking, setAsking] = useState(false)

  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)}
        className="btn !bg-white !text-[#C0392B] border !border-[#F0C9C9] hover:!bg-[#FDF2F2]">
        {label}
      </button>
    )
  }
  return (
    <span className="flex items-center gap-2 flex-wrap">
      <span className="text-[12.5px] text-ink-muted">ลบ “{confirmText.slice(0, 40)}” ใช่ไหม?</span>
      <button type="button" onClick={() => setAsking(false)} className="btn btn-ghost !min-h-[36px] !text-[12.5px]">ไม่ลบ</button>
      <button type="submit" formAction={action}
        className="btn !min-h-[36px] !text-[12.5px] !bg-[#C0392B] !text-white">ยืนยันลบ</button>
    </span>
  )
}
