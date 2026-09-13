'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { confirmDelete, toastSuccess, alertError } from '@/lib/ui'

/**
 * ปุ่มลบที่ถาม SweetAlert2 ก่อนเสมอ — แทน deleteItem() ของเว็บ PHP
 * action คือ server action ที่คืน { ok } ให้รู้ว่าลบผ่านหรือไม่
 */
export default function ConfirmDelete({
  action, name, extra, className, title, ariaLabel, children, done, successMsg,
}: {
  action: () => Promise<{ ok: boolean; error?: string }>
  name: string
  extra?: string
  className?: string
  title?: string
  ariaLabel?: string
  children?: React.ReactNode
  /** ปลายทางหลังลบสำเร็จ — ไม่ใส่ = refresh หน้าเดิม */
  done?: string
  successMsg?: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [, startTransition] = useTransition()

  return (
    <button type="button" className={className ?? 'icon-btn del w-10 h-10'} title={title} aria-label={ariaLabel ?? title ?? 'ลบ'}
      disabled={busy}
      onClick={async () => {
        if (!(await confirmDelete(name, extra))) return
        setBusy(true)
        try {
          const r = await action()
          if (!r.ok) { alertError(r.error || 'ลบไม่สำเร็จ'); return }
          toastSuccess(successMsg ?? 'ลบเรียบร้อยแล้ว')
          startTransition(() => { done ? router.push(done) : router.refresh() })
        } catch {
          alertError('ลบไม่สำเร็จ')
        } finally {
          setBusy(false)
        }
      }}>
      {children ?? '🗑️'}
    </button>
  )
}
