import {
  getWorkloads,
  WORKLOAD_CATEGORIES,
  saveWorkload,
  deleteWorkload,
} from '@/lib/workload'

import { requireAdmin } from '@/lib/auth'
import PageHead from '@/components/admin/PageHead'
import AjaxForm, { SubmitButton } from '@/components/admin/AjaxForm'
import DriveInput from '@/components/admin/DriveInput'
import DriveLinkInput from '@/components/admin/DriveLinkInput'
import ConfirmDelete from '@/components/admin/ConfirmDelete'

async function saveWorkloadAction(
  f: FormData
): Promise<{ ok: boolean; error?: string }> {
  'use server'

  return saveWorkload(f)
}

export const dynamic = 'force-dynamic'

export default async function WorkloadAdminPage() {
  await requireAdmin()

  const rows = await getWorkloads()

  // คำนวณผลรวมชั่วโมงภาระงานทั้งหมด
  const totalHours = rows.reduce(
    (sum, row) => sum + Number(row.hours || 0),
    0
  )

  return (
    <>
      <PageHead
        title="📋 ภาระงานตาม อ.ก.ค.ศ."
        sub="เพิ่ม แก้ไข ลบ และจัดการหลักฐานประกอบภาระงาน"
      />

      {/* =====================================================
          สรุปผลรวมชั่วโมง
      ====================================================== */}
      <section className="card-soft mt-5 p-5 md:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-bold text-[16px]">
              ผลรวมชั่วโมงภาระงาน
            </div>

            <div className="text-[12.5px] text-ink-muted mt-1">
              รวมจากรายการภาระงานที่บันทึกไว้ทั้งหมด
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-3xl font-extrabold">
              {totalHours}
            </div>

            <div className="text-[12px] text-ink-muted">
              ชั่วโมง/สัปดาห์
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          ฟอร์มเพิ่มภาระงาน
      ====================================================== */}
      <section className="card-soft mt-5 p-5 md:p-7">
        <h2 className="font-bold text-[16px]">
          ➕ เพิ่มภาระงาน
        </h2>

        <p className="text-[12.5px] text-ink-muted mt-1">
          ข้อมูลที่บันทึกจะนำไปแสดงที่หน้าเว็บโดยอัตโนมัติ
        </p>

        <AjaxForm
          action={saveWorkloadAction}
          successMsg="เพิ่มภาระงานสำเร็จ!"
        >
          <div className="grid md:grid-cols-2 gap-4 mt-5">

            {/* ปีการศึกษา */}
            <div>
              <label className="lbl req">
                ปีการศึกษา
              </label>

              <input
                className="inp"
                name="academic_year"
                type="number"
                defaultValue="2569"
                required
              />
            </div>

            {/* ภาคเรียน */}
            <div>
              <label className="lbl">
                ภาคเรียน
              </label>

              <select
                className="inp"
                name="semester"
                defaultValue="1"
              >
                <option value="1">
                  ภาคเรียนที่ 1
                </option>

                <option value="2">
                  ภาคเรียนที่ 2
                </option>
              </select>
            </div>

            {/* หมวดภาระงาน */}
            <div className="md:col-span-2">
              <label className="lbl req">
                หมวดภาระงาน
              </label>

              <select
                className="inp"
                name="category"
                defaultValue={WORKLOAD_CATEGORIES[0]}
                required
              >
                {WORKLOAD_CATEGORIES.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* รหัสวิชา */}
            <div>
              <label className="lbl req">
                รหัสวิชา
              </label>

              <input
                className="inp"
                name="subject_code"
                placeholder="เช่น ว15101"
                required
              />
            </div>

            {/* ชั้น */}
            <div>
              <label className="lbl req">
                ชั้น
              </label>

              <input
                className="inp"
                name="grade_level"
                placeholder="เช่น ป.5"
                required
              />
            </div>

            {/* รายวิชา */}
            <div className="md:col-span-2">
              <label className="lbl req">
                รายวิชา
              </label>

              <input
                className="inp"
                name="subject_name"
                placeholder="เช่น วิทยาการคำนวณ"
                required
              />
            </div>

            {/* ชื่อภาระงาน */}
            <div className="md:col-span-2">
              <label className="lbl req">
                ชื่อภาระงาน
              </label>

              <input
                className="inp"
                name="title"
                placeholder="เช่น ปฏิบัติการสอน"
                required
              />
            </div>

            {/* ชั่วโมง */}
            <div>
              <label className="lbl">
                ชั่วโมง/สัปดาห์
              </label>

              <input
                className="inp"
                name="hours"
                type="number"
                step="0.5"
                min="0"
                defaultValue="0"
              />
            </div>

            {/* ลำดับ */}
            <div>
              <label className="lbl">
                ลำดับการแสดง
              </label>

              <input
                className="inp"
                name="sort_order"
                type="number"
                defaultValue="0"
              />
            </div>

            {/* รายละเอียด */}
            <div className="md:col-span-2">
              <label className="lbl">
                รายละเอียด
              </label>

              <textarea
                className="inp"
                name="description"
                rows={4}
                placeholder="รายละเอียดการปฏิบัติงาน..."
              />
            </div>

            {/* ภาพหลักฐาน */}
            <div className="md:col-span-2">
              <DriveInput
                name="image"
                label="📷 ภาพหลักฐาน"
                hint="เช่น ภาพตารางสอน ภาพการจัดกิจกรรม หรือภาพการปฏิบัติงาน"
              />
            </div>

            {/* เอกสารหลักฐาน */}
            <div className="md:col-span-2">
              <label className="lbl">
                📄 เอกสารหลักฐาน
              </label>

              <DriveLinkInput name="file" />

              <input
                className="inp mt-2"
                name="file_name"
                placeholder="ชื่อเอกสาร เช่น คำสั่งที่ 125/2569"
              />
            </div>
          </div>

          {/* ปุ่มบันทึก */}
          <div className="flex justify-end mt-6 pt-5 border-t border-[color:var(--divider)]">
            <SubmitButton>
              💾 บันทึกภาระงาน
            </SubmitButton>
          </div>
        </AjaxForm>
      </section>

      {/* =====================================================
          รายการภาระงาน
      ====================================================== */}
      <section className="mt-5">
        <h2 className="font-bold text-[16px] mb-3">
          📋 รายการภาระงานทั้งหมด ({rows.length})
        </h2>

        <div className="flex flex-col gap-3">

          {rows.map((row) => (
            <div
              key={row.id}
              className="card-soft p-5"
            >
              <div className="flex flex-wrap gap-3 items-start justify-between">

                {/* ข้อมูลภาระงาน */}
                <div className="min-w-0">

                  {/* หมวด */}
                  <span className="chip chip-primary">
                    {row.category}
                  </span>

                  {/* ชื่อภาระงาน */}
                  <h3 className="font-bold text-[16px] mt-2">
                    {row.title}
                  </h3>

                  {/* ข้อมูลวิชา */}
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

                  {/* ปี / ภาคเรียน / ชั่วโมง */}
                  <p className="text-[12.5px] text-ink-muted mt-2">
                    ปีการศึกษา {row.academic_year}
                    {' · '}
                    ภาคเรียนที่ {row.semester}
                    {' · '}
                    {Number(row.hours || 0)} ชั่วโมง/สัปดาห์
                  </p>

                  {/* รายละเอียด */}
                  {row.description && (
                    <p className="text-[13px] text-ink-soft mt-3 whitespace-pre-line">
                      {row.description}
                    </p>
                  )}

                </div>

                {/* ปุ่มลบ */}
                <div className="flex gap-2 shrink-0">
                  <ConfirmDelete
                    action={async () => {
                      'use server'

                      return deleteWorkload(row.id)
                    }}
                    name={row.title}
                    successMsg="ลบภาระงานแล้ว"
                  />
                </div>

              </div>

              {/* =================================================
                  หลักฐาน
              ================================================== */}
              {(row.image_ref || row.file_ref) && (
                <div className="mt-4 pt-4 border-t border-[color:var(--divider)] flex flex-wrap gap-2">

                  {/* ดูภาพ */}
                  {row.image_ref && (
                    <a
                      href={`/workload#workload-${row.id}`}
                      className="btn btn-white"
                    >
                      📷 ดูภาพ
                    </a>
                  )}

                  {/* เปิดเอกสาร */}
                  {row.file_ref && (
                    <a
                      href={`https://drive.google.com/file/d/${row.file_ref}/view`}
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
          ))}

          {/* ไม่มีข้อมูล */}
          {rows.length === 0 && (
            <div className="card-soft p-10 text-center text-ink-muted">
              ยังไม่มีภาระงาน
            </div>
          )}

        </div>
      </section>
    </>
  )
}
