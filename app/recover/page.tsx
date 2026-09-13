import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isFresh } from '@/lib/setup'
import { hasRecoveryCode } from '@/lib/recovery'
import RecoverForm from '@/components/RecoverForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'ลืมรหัสผ่าน' }

/** ตั้งรหัสผ่านใหม่ด้วยรหัสกู้คืน — ทางออกเวลาลืมรหัสผ่าน โดยไม่ต้องพิมพ์คำสั่งใด ๆ */
export default async function RecoverPage() {
  if (await isFresh()) redirect('/setup')      // ยังไม่มีบัญชี = ยังไม่ได้ติดตั้ง
  const has = await hasRecoveryCode()

  return (
    <main className="min-h-screen mesh grid place-items-center p-5 md:p-10 overflow-hidden relative">
      <div className="blob blob-1 w-[420px] h-[420px] -right-24 -top-24" />
      <div className="blob blob-2 w-[320px] h-[320px] -left-20 bottom-0" />

      <div className="relative w-full max-w-[520px] card-soft overflow-hidden">
        <div className="p-6 text-white text-center" style={{ background: 'var(--grad-hero)' }}>
          <div className="text-3xl">🔑</div>
          <h1 className="mt-2 text-[20px] font-extrabold">ลืมรหัสผ่าน</h1>
          <p className="text-[12.5px] text-white/75">ใช้รหัสกู้คืนที่ได้ตอนติดตั้งระบบ</p>
        </div>

        <div className="p-6">
          {has ? (
            <RecoverForm />
          ) : (
            <div className="text-[13.5px] text-ink-soft leading-relaxed">
              <p className="rounded-xl px-4 py-3 bg-[#FDECEC] text-[#B3261E] border border-[#F5C2C0] font-semibold">
                ระบบนี้ยังไม่มีรหัสกู้คืน
              </p>
              <p className="mt-4">
                เกิดขึ้นได้ 2 กรณี — ติดตั้งไว้ก่อนที่ระบบนี้จะมีรหัสกู้คืน หรือใช้รหัสไปแล้วครั้งหนึ่ง
              </p>
              <p className="mt-2">
                ถ้ายังเข้าหลังบ้านได้อยู่ ให้เข้าไปที่หน้า <b className="text-ink">ตั้งค่าระบบ</b> แล้วกดออกรหัสกู้คืนใบใหม่เก็บไว้
                ถ้าเข้าไม่ได้แล้ว ให้ติดต่อผู้ที่ติดตั้งระบบให้คุณ
              </p>
            </div>
          )}

          <p className="mt-6 text-center">
            <Link href="/login" className="text-[13px] text-ink-muted hover:text-primary-deep">← กลับหน้าเข้าสู่ระบบ</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
