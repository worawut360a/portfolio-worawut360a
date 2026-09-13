'use client'

import { useRef, useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { toastSuccess, toastError } from '@/lib/ui'

/**
 * ฟอร์มที่บันทึกแล้วขึ้น toast โดยไม่โหลดหน้าใหม่ — แทน submitForm() ของเว็บ PHP
 * action คือ server action ที่คืน { ok } กลับมา
 */
export default function AjaxForm({
  action, successMsg, className, resetOnSuccess, children,
}: {
  action: (f: FormData) => Promise<{ ok: boolean; error?: string }>
  successMsg: string
  className?: string
  /** ล้างค่าในฟอร์มหลังบันทึกสำเร็จ — ใช้กับฟอร์มที่กรอกใหม่ทุกครั้ง เช่น เปลี่ยนรหัสผ่าน */
  resetOnSuccess?: boolean
  children: React.ReactNode
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [err, setErr] = useState('')
  const box = useRef<HTMLFormElement>(null)

  return (
    <form autoComplete="off" className={className} action={async (f) => {
      const r = await action(f)
      if (!r.ok) { setErr(r.error ?? ''); toastError(r.error || 'บันทึกไม่สำเร็จ'); return }
      setErr('')
      toastSuccess(successMsg)
      if (resetOnSuccess) box.current?.reset()
      startTransition(() => router.refresh())
    }} ref={box}>
      {children}
      {err && <p className="text-[12px] text-coral-deep mt-3">{err}</p>}
    </form>
  )
}

/** ปุ่มบันทึกที่รู้สถานะกำลังส่งของฟอร์มที่ครอบอยู่ */
export function SubmitButton({ children, className = 'btn btn-primary' }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus()
  return <button type="submit" className={className} disabled={pending}>{pending ? 'กำลังบันทึก…' : children}</button>
}
