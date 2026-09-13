'use server'

import { revalidatePath } from 'next/cache'
import { install, type InstallResult } from '@/lib/setup'

export async function doInstall(f: FormData): Promise<InstallResult> {
  const res = await install({
    username: String(f.get('username') ?? '').trim(),
    password: String(f.get('password') ?? ''),
    fullName: String(f.get('full_name') ?? '').trim(),
    withDemo: !!f.get('demo'),
  })

  return res
}

/**
 * ล้างแคชทุกหน้า — เรียกตอนครูกดออกจากหน้าติดตั้งเท่านั้น
 *
 * ตอน build ยังไม่มีตาราง หน้าสาธารณะจึงถูกสร้างไว้เป็น "พาไป /setup" ทั้งหมด
 * ถ้าไม่ล้าง ครูจะติดตั้งเสร็จแล้วกดดูหน้าเว็บ แต่โดนเด้งกลับมา /setup อีกนานถึง 1 ชั่วโมง
 *
 * ห้ามเรียกใน doInstall เด็ดขาด — การล้างแคชทำให้หน้าที่เปิดอยู่ (คือ /setup)
 * render ใหม่ทันที แล้วเด้งไป /login เพราะติดตั้งไปแล้ว
 * ครูจะไม่ทันเห็น "รหัสกู้คืน" ที่โชว์ได้ครั้งเดียว
 */
export async function finishSetup(): Promise<void> {
  revalidatePath('/', 'layout')
}
