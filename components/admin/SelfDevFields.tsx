import { Field, inputClass } from '@/components/admin/Field'
import type { SelfDev } from '@/lib/types'

export default function SelfDevFields({ item, fiscalYear }: { item?: SelfDev | null; fiscalYear: number }) {
  const years = Array.from({ length: 8 }, (_, i) => fiscalYear + 1 - i)
  return (
    <div className="flex flex-col gap-4">
      <Field label="ชื่อรายการ" required>
        <input name="title" required defaultValue={item?.title ?? ''} className={inputClass} />
      </Field>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="ประเภท">
          <select name="type" defaultValue={item?.type ?? 'อบรม'} className={inputClass}>
            {['อบรม', 'สัมมนา', 'ศึกษาดูงาน', 'PLC', 'วิทยากร'].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="หน่วยงานที่จัด">
          <input name="organizer" defaultValue={item?.organizer ?? ''} className={inputClass} />
        </Field>
        <Field label="วันที่เริ่ม">
          <input name="start_date" type="date" defaultValue={item?.start_date ?? ''} className={inputClass} />
        </Field>
        <Field label="วันที่สิ้นสุด">
          <input name="end_date" type="date" defaultValue={item?.end_date ?? ''} className={inputClass} />
        </Field>
        <Field label="จำนวนชั่วโมง">
          <input name="hours" type="number" min={0} defaultValue={item?.hours ?? 0} className={inputClass} />
        </Field>
        <Field label="ปีงบประมาณ">
          <select name="fiscal_year" defaultValue={item?.fiscal_year ?? fiscalYear} className={inputClass}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </Field>
      </div>
    </div>
  )
}
