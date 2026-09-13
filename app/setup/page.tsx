import { redirect } from 'next/navigation'
import { getStatus, isFresh } from '@/lib/setup'
import SetupForm from '@/components/SetupForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'ติดตั้งระบบ' }

function Row({ ok, label, detail }: { ok: boolean | null; label: string; detail?: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[color:var(--divider)] last:border-0">
      <span className="w-5 shrink-0 text-center">{ok === null ? '—' : ok ? '✓' : '✕'}</span>
      <span className="flex-1 text-[13.5px]">
        {label}
        {detail && <span className="block text-[12px] text-ink-faint">{detail}</span>}
      </span>
      <span className={`text-[12.5px] font-bold shrink-0 ${
        ok === null ? 'text-ink-faint' : ok ? 'text-[#2E7D4F]' : 'text-[#C0392B]'}`}>
        {ok === null ? 'ทราบไว้' : ok ? 'พร้อม' : 'ยังไม่พร้อม'}
      </span>
    </div>
  )
}

export default async function SetupPage({
  searchParams,
}: { searchParams: Promise<Record<string, never>> }) {
  void searchParams

  // ติดตั้งไปแล้ว = ปิดหน้านี้ถาวร ไม่ให้ใครมาติดตั้งทับ
  if (!(await isFresh())) redirect('/login')

  const s = await getStatus()
  const ready = s.envDb && s.dbReachable

  return (
    <div className="min-h-[80vh] px-4 py-12">
      <div className="max-w-[640px] mx-auto">
        <div className="card-soft overflow-hidden">
          <div className="p-6 text-white" style={{ background: 'var(--grad-hero)' }}>
            <div className="text-3xl">🚀</div>
            <h1 className="mt-1.5 text-[22px] font-extrabold">ติดตั้งแฟ้มสะสมผลงานครู</h1>
            <p className="text-[12.5px] text-white/75">ทำครั้งเดียวตอนเริ่มใช้งาน แล้วหน้านี้จะปิดตัวเองอัตโนมัติ</p>
          </div>

          <div className="p-6">
            <h2 className="font-extrabold text-[15px] mb-1">ตรวจความพร้อม</h2>
            <div className="mb-5">
              <Row ok={s.envDb} label="ตั้งค่า TURSO_DATABASE_URL แล้ว"
                detail={s.envDb ? undefined : 'ไปตั้งใน Netlify → Site settings → Environment variables'} />
              <Row ok={null} label="กุญแจเซ็นเซสชัน"
                detail={process.env.AUTH_SECRET ? 'ใช้ค่าที่ตั้งไว้ใน AUTH_SECRET' : 'ระบบจะสุ่มให้อัตโนมัติ ไม่ต้องตั้งเอง'} />
              <Row ok={s.dbReachable} label="เชื่อมต่อฐานข้อมูลได้" detail={s.error} />
              <Row ok={null} label="ตารางในฐานข้อมูล"
                detail={s.tables === 0 ? 'ยังไม่มี — ระบบจะสร้างให้ตอนกดติดตั้ง' : `พบ ${s.tables} ตาราง`} />
            </div>

            {!ready ? (
              <p className="rounded-xl px-4 py-3 text-[13.5px] bg-[#FDECEC] text-[#B3261E] border border-[#F5C2C0]">
                ยังตั้งค่าไม่ครบ — แก้ตามรายการด้านบนแล้ว deploy ใหม่อีกครั้ง
              </p>
            ) : (
              <SetupForm />
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-[11.5px] text-ink-faint">
          หน้านี้เปิดได้เฉพาะตอนที่ยังไม่มีบัญชีผู้ดูแล ติดตั้งเสร็จแล้วจะเข้าไม่ได้อีก
        </p>
      </div>
    </div>
  )
}
