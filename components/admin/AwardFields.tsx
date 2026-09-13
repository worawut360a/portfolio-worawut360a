import { Field, inputClass } from '@/components/admin/Field'
import type { Award } from '@/lib/types'

export default function AwardFields({ item }: { item?: Award | null }) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="ชื่อรางวัล" required>
        <input name="title" required defaultValue={item?.title ?? ''} className={inputClass} />
      </Field>
      <div className="grid md:grid-cols-3 gap-4">
        <Field label="หน่วยงานที่มอบ">
          <input name="awarder" defaultValue={item?.awarder ?? ''} className={inputClass} />
        </Field>
        <Field label="ระดับ">
          <select name="level" defaultValue={item?.level ?? 'โรงเรียน'} className={inputClass}>
            {['โรงเรียน', 'เขตพื้นที่', 'จังหวัด', 'ภาค', 'ชาติ', 'นานาชาติ'].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="วันที่ได้รับ">
          <input name="award_date" type="date" defaultValue={item?.award_date ?? ''} className={inputClass} />
        </Field>
      </div>
    </div>
  )
}
