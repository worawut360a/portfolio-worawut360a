import { getWorkloads } from '@/lib/workload'
import { imageUrl, fileUrl, IMG } from '@/lib/media'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const icons: Record<string, string> = {
  'การจัดการเรียนรู้': '📚',
  'งานส่งเสริมและสนับสนุนการจัดการเรียนรู้': '🤝',
  'งานพัฒนาคุณภาพการศึกษาของสถานศึกษา': '🏫',
  'งานตอบสนองนโยบายและจุดเน้น': '🎯',
}

export default async function WorkloadPage() {
  const rows = await getWorkloads()

  // ผลรวมชั่วโมงภาระงานทั้งหมด
  const totalHours = rows.reduce(
    (sum, row) => sum + Number(row.hours || 0),
    0
  )

  // รายการหมวดภาระงาน
  const groups = Array.from(
    new Set(rows.map((row) => row.category))
  )

  return (
    <main>

      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="relative overflow-hidden mesh">
        <div className="blob blob-1 w-[320px] h-[320px] -right-20 -top-10" />

        <div className="blob blob-3 w-[220px] h-[220px] -left-16 bottom-0 hidden md:block" />

        <div className="relative max-w-[1240px] mx-auto px-4 md:px-10 py-12 md:py-16">

          <span className="chip chip-primary">
            📋 ภาระงานครู
          </span>

          <h1 className="mt-4 text-[34px] md:text-[48px] font-extrabold leading-tight">
            ภาระงานตาม
            <span className="grad-text">
              {' '}อ.ก.ค.ศ. กำหนด
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-[14px] md:text-[16px] text-ink-soft">
            รายละเอียดภาระงาน การจัดการเรียนรู้ งานสนับสนุน
            งานพัฒนาคุณภาพสถานศึกษา และงานตามนโยบาย
            พร้อมหลักฐานประกอบการปฏิบัติงาน
          </p>

          {/* สถิติ */}
          <div className="mt-7 grid grid-cols-2 md:grid-cols-3 gap-3 max-w-[700px]">

            {/* จำนวนรายการ */}
            <div className="card-soft p-4">
              <p className="text-[11px] text-ink-muted">
                รายการภาระงาน
              </p>

              <p className="text-2xl font-extrabold mt-1">
                {rows.length}
              </p>
            </div>

            {/* ชั่วโมงรวม */}
            <div className="card-soft p-4">
              <p className="text-[11px] text-ink-muted">
                ชั่วโมงรวม/สัปดาห์
              </p>

              <p className="text-2xl font-extrabold mt-1">
                {totalHours}
              </p>
            </div>

            {/* จำนวนหมวด */}
            <div className="card-soft p-4 col-span-2 md:col-span-1">
              <p className="text-[11px] text-ink-muted">
                หมวดงาน
              </p>

              <p className="text-2xl font-extrabold mt-1">
                {groups.length}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================
          CONTENT
      ====================================================== */}
      <section className="max-w-[1240px] mx-auto px-4 md:px-10 py-10">

        {groups.map((category) => {
          const categoryRows = rows.filter(
            (row) => row.category === category
          )

          const categoryHours = categoryRows.reduce(
            (sum, row) => sum + Number(row.hours || 0),
            0
          )

          return (
            <section
              key={category}
              className="mb-7"
            >

              {/* หัวข้อหมวด */}
              <div className="flex flex-wrap items-end justify-between gap-3 mb-3">

                <div>
                  <span className="chip chip-primary">
                    {icons[category] || '📋'}
                  </span>

                  <h2 className="mt-2 text-[22px] md:text-[28px] font-extrabold">
                    {category}
                  </h2>
                </div>

                <span className="chip chip-glass">
                  {categoryHours} ชั่วโมง/สัปดาห์
                </span>

              </div>

              {/* รายการ */}
              <div className="grid md:grid-cols-2 gap-4">

                {categoryRows.map((row) => (
                  <article
                    key={row.id}
                    id={`workload-${row.id}`}
                    className="card-soft overflow-hidden"
                  >

                    {/* =================================================
                        ภาพหลักฐาน
                    ================================================== */}
                    {row.image_ref && (
                      <div className="aspect-[16/9] bg-primary-soft overflow-hidden">

                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl(
                            {
                              source: row.image_source,
                              ref: row.image_ref,
                            },
                            IMG.card
                          )}
                          alt={row.title}
                          className="w-full h-full object-cover"
                        />

                      </div>
                    )}

                    {/* =================================================
                        ข้อมูล
                    ================================================== */}
                    <div className="p-5">

                      {/* ชื่อ + ชั่วโมง */}
                      <div className="flex justify-between gap-3 items-start">

                        {/* ข้อมูลด้านซ้าย */}
                        <div className="min-w-0">

                          <h3 className="font-extrabold text-[17px]">
                            {row.title}
                          </h3>

                          {/* ข้อมูลรายวิชา */}
                          <div className="text-[13px] text-ink-soft mt-2 space-y-1">

                            <div>
                              <strong>รหัสวิชา:</strong>{' '}
                              {row.subject_code || '-'}
                            </div>

                            <div>
                              <strong>รายวิชา:</strong>{' '}
                              {row.subject_name || '-'}
                            </div>

                            <div>
                              <strong>ชั้น:</strong>{' '}
                              {row.grade_level || '-'}
                            </div>

                          </div>

                          {/* ปีการศึกษา / ภาคเรียน */}
                          <p className="text-[12px] text-ink-muted mt-2">
                            ปีการศึกษา {row.academic_year}
                            {' · '}
                            ภาคเรียนที่ {row.semester}
                            {' · '}
                            {Number(row.hours || 0)} ชั่วโมง/สัปดาห์
                          </p>

                        </div>

                        {/* ชั่วโมง */}
                        <span className="chip chip-primary shrink-0">
                          {Number(row.hours || 0)} ชม.
                        </span>

                      </div>

                      {/* =================================================
                          รายละเอียด
                      ================================================== */}
                      {row.description && (
                        <p className="mt-4 text-[13.5px] text-ink-soft leading-relaxed whitespace-pre-line">
                          {row.description}
                        </p>
                      )}

                      {/* =================================================
                          หลักฐาน
                      ================================================== */}
                      {(row.image_ref || row.file_ref) && (
                        <div className="mt-5 pt-4 border-t border-[color:var(--divider)] flex flex-wrap gap-2">

                          {/* เปิดภาพ */}
                          {row.image_ref && (
                            <a
                              href={imageUrl(
                                {
                                  source: row.image_source,
                                  ref: row.image_ref,
                                },
                                IMG.full
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-white"
                            >
                              📷 เปิดภาพหลักฐาน
                            </a>
                          )}

                          {/* เปิดเอกสาร */}
                          {row.file_ref && (
                            <a
                              href={
                                fileUrl({
                                  source: row.file_source,
                                  ref: row.file_ref,
                                }) ?? '#'
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-white"
                            >
                              📄 {row.file_name || 'เปิดเอกสาร'}
                            </a>
                          )}

                        </div>
                      )}

                    </div>

                  </article>
                ))}

              </div>

            </section>
          )
        })}

        {/* =====================================================
            ไม่มีข้อมูล
        ====================================================== */}
        {rows.length === 0 && (
          <div className="card-soft p-12 text-center">

            <div className="text-5xl">
              📋
            </div>

            <h2 className="font-bold text-xl mt-4">
              ยังไม่มีข้อมูลภาระงาน
            </h2>

            <p className="text-sm text-ink-muted mt-2">
              เพิ่มข้อมูลจากระบบหลังบ้าน แล้วข้อมูลจะแสดงที่หน้านี้
            </p>

            <Link
              href="/admin/workload"
              className="btn btn-primary mt-5"
            >
              ไปยังหลังบ้าน
            </Link>

          </div>
        )}

      </section>

    </main>
  )
}
