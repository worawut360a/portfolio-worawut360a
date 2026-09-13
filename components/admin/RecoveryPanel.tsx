'use client'

import { useState } from 'react'
import RecoveryCodeBox from '@/components/RecoveryCodeBox'
import { newRecoveryCode } from '@/app/admin/settings/actions'
import { confirmDelete, toastSuccess, alertError } from '@/lib/ui'

/**
 * ออก/ต่ออายุรหัสกู้คืน — ใช้ตอนลืมรหัสผ่านโดยไม่ต้องพิมพ์คำสั่ง
 * ระบบเก็บแค่ค่าที่ hash แล้ว จึงเปิดดูใบเดิมไม่ได้ ทำได้แค่ออกใบใหม่ทับ
 */
export default function RecoveryPanel({ has }: { has: boolean }) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  async function issue() {
    if (has && !(await confirmDelete('รหัสกู้คืนใบเดิม', 'ออกใบใหม่แล้วใบเดิมจะใช้ไม่ได้ทันที'))) return
    setBusy(true)
    try {
      const r = await newRecoveryCode()
      if (!r.ok) { alertError(r.error); return }
      setCode(r.code)
      toastSuccess('ออกรหัสกู้คืนใบใหม่แล้ว')
    } catch {
      alertError('ออกรหัสกู้คืนไม่สำเร็จ')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-5 pt-4 border-t border-dashed border-primary-line/60">
      <p className="text-[13px] font-bold">🔑 รหัสกู้คืน</p>
      <p className="text-[12px] text-ink-muted mt-0.5 leading-relaxed">
        {has
          ? 'ระบบมีรหัสกู้คืนอยู่แล้ว · ถ้าทำใบเดิมหาย กดออกใบใหม่ได้ (ใบเก่าจะใช้ไม่ได้ทันที)'
          : 'ยังไม่มีรหัสกู้คืน — แนะนำให้ออกไว้เก็บ จะได้ตั้งรหัสผ่านใหม่เองได้ตอนลืมรหัสผ่าน'}
      </p>

      {code
        ? <div className="mt-3"><RecoveryCodeBox code={code} /></div>
        : (
          <button type="button" className={`btn btn-sm mt-3 ${has ? 'btn-ghost' : 'btn-primary'}`}
            onClick={() => void issue()} disabled={busy}>
            {busy ? 'กำลังออกรหัส…' : has ? 'ออกรหัสกู้คืนใบใหม่' : 'ออกรหัสกู้คืน'}
          </button>
        )}
    </div>
  )
}
