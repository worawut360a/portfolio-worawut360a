import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="max-w-[820px] mx-auto px-4 py-24 text-center">
      <div className="card-soft p-12">
        <div className="text-5xl">🔍</div>
        <h1 className="mt-4 text-[24px] font-extrabold">ไม่พบหน้าที่ต้องการ</h1>
        <p className="mt-2 text-[14px] text-ink-muted">หน้านี้อาจถูกลบไปแล้ว หรือที่อยู่ไม่ถูกต้อง</p>
        <Link href="/" className="btn btn-primary mt-6">← กลับหน้าแรก</Link>
      </div>
    </div>
  )
}
