export default function WorkloadAdminPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">
        ภาระงานตาม อ.ก.ค.ศ. กำหนด
      </h1>

      <p className="mt-2 text-gray-600">
        จัดการข้อมูลภาระงาน ตารางสอน และหลักฐานประกอบ
      </p>

      <div className="mt-6 rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold">
          จัดการภาระงาน
        </h2>

        <div className="mt-4">
          <button
            type="button"
            className="rounded-lg bg-black px-4 py-2 text-white"
          >
            + เพิ่มภาระงาน
          </button>
        </div>

        <p className="mt-6 text-gray-500">
          ยังไม่มีข้อมูลภาระงาน
        </p>
      </div>
    </main>
  )
}
