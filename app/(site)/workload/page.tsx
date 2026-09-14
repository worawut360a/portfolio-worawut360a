export default function WorkloadPage() {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold">
          ภาระงานตาม อ.ก.ค.ศ. กำหนด
        </h1>

        <p className="mt-2 text-gray-600">
          ข้อมูลภาระงานของครูผู้รับการประเมิน
        </p>

        <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            การจัดการเรียนรู้
          </h2>

          <p className="mt-3 text-gray-600">
            ยังไม่มีข้อมูลภาระงาน
          </p>
        </div>
      </div>
    </main>
  )
}
