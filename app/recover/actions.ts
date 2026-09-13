'use server'

import { recoverPassword, type RecoverResult } from '@/lib/recovery'

export async function doRecover(f: FormData): Promise<RecoverResult> {
  const code = String(f.get('code') ?? '')
  const pw = String(f.get('new_password') ?? '')
  const confirm = String(f.get('confirm_password') ?? '')
  if (pw !== confirm) return { ok: false, error: 'รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน' }
  return recoverPassword(code, pw)
}
