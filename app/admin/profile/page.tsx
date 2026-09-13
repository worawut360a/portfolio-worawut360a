import { requireAdmin } from '@/lib/auth'
import { getProfile, getEducations, getCareerPaths, getSetting } from '@/lib/queries'
import { imageUrl, focalPosition, IMG } from '@/lib/media'
import { isSiteTheme } from '@/lib/theme'
import PageHead from '@/components/admin/PageHead'
import AjaxForm, { SubmitButton } from '@/components/admin/AjaxForm'
import DriveInput from '@/components/admin/DriveInput'
import FocalPicker from '@/components/admin/FocalPicker'
import EducationSection from '@/components/admin/EducationSection'
import CareerSection from '@/components/admin/CareerSection'
import { saveProfile } from './actions'

/** ตัดศูนย์ท้ายทศนิยมทิ้งเหมือน PHP ที่ cast เป็น (float) แล้วพิมพ์ */
const trimNum = (n: unknown) => String(Number(n ?? 0))

/** หัวข้อคั่นในฟอร์ม — ไอคอนสี + ชื่อหัวข้อ + เส้นคั่น */
function Head({ icon, bg, children, pt }: { icon: string; bg: string; children: React.ReactNode; pt?: boolean }) {
  return (
    <div className={`md:col-span-2 flex items-center gap-2.5${pt ? ' pt-2' : ''}`}>
      <span className={`w-9 h-9 rounded-xl grid place-items-center text-base ${bg} shrink-0`}>{icon}</span>
      <h3 className="font-bold text-[14px]">{children}</h3>
      <span className="flex-1 h-px bg-[color:var(--divider)]" />
    </div>
  )
}

/** โปรไฟล์ครู + วุฒิการศึกษา + เส้นทางรับราชการ — แปลงจาก admin/profile.php */
export default async function ProfileAdmin() {
  await requireAdmin()   // ต้องตรวจในทุกหน้า ไม่ใช่แค่ layout — Next render layout กับ page พร้อมกัน

  const [p, educs, careers, theme] = await Promise.all([
    getProfile(), getEducations(), getCareerPaths(), getSetting('theme'),
  ])

  // หน้าแรกทุกธีมแสดงรูปครูเป็นการ์ดแนวตั้ง 4:5 (ยึดขอบบน) → กรอบตัวอย่างใช้สัดส่วนเดียวกัน
  const cropLabel = 'แนวตั้ง 4:5'
  const avatar = { source: p?.avatar_source ?? null, ref: p?.avatar_ref ?? null }
  const fx = Number(p?.avatar_focus_x ?? 50)
  const fy = Number(p?.avatar_focus_y ?? 35)

  return (
    <>
      <PageHead title="โปรไฟล์ครู 👩‍🏫" sub="ข้อมูลนี้จะแสดงบนหน้าแรก หน้าประวัติครู และหน้าติดต่อ" />

      <AjaxForm action={saveProfile} successMsg="บันทึกโปรไฟล์สำเร็จ!">
        <div className="mt-5 grid lg:grid-cols-[340px_1fr] gap-4 items-start">

          {/* รูปโปรไฟล์ */}
          <section className="bg-white rounded-[1.6rem] p-6 shadow-soft border border-[color:var(--border)] text-center lg:sticky lg:top-3">
            <div className="flex items-center justify-between gap-2 mb-5">
              <h2 className="font-bold text-[16px]">🖼️ รูปโปรไฟล์</h2>
              <span className="chip chip-primary">{cropLabel}</span>
            </div>

            <div className="relative mx-auto w-[220px] max-w-full">
              <div className="absolute -inset-4 rounded-[2.2rem] grad-bg opacity-25 blur-2xl pointer-events-none" aria-hidden="true" />
              <div className="relative p-[4px] grad-bg rounded-[1.6rem] shadow-glow">
                <div className="aspect-[4/5] rounded-[1.4rem] overflow-hidden bg-primary-soft">
                  {avatar.ref
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={imageUrl(avatar, IMG.avatar)} alt="รูปโปรไฟล์"
                        className="w-full h-full object-cover" style={{ objectPosition: focalPosition(fx, fy) }} />
                    : <span className="w-full h-full grid place-items-center text-5xl">👩‍🏫</span>}
                </div>
              </div>
            </div>

            <p className="mt-5 text-[12px] text-ink-muted">
              ธีมปัจจุบัน: <b className="text-primary-deep">{isSiteTheme(theme) ? theme : 'royal'}</b> · แสดงเป็น <b className="text-ink">{cropLabel}</b>
            </p>

            <div className="mt-4 text-left">
              <DriveInput name="avatar" label="📷 รูปโปรไฟล์ (ลิงก์จาก Google Drive)"
                defaultSource={p?.avatar_source} defaultRef={p?.avatar_ref}
                hint="วางลิงก์แชร์รูปจาก Google Drive · ตั้งค่าเป็น “ทุกคนที่มีลิงก์” ก่อน" />
            </div>

            <div className="mt-4 text-left">
              <FocalPicker source={p?.avatar_source ?? null} refValue={p?.avatar_ref ?? null} x={fx} y={fy} />
            </div>
          </section>

          {/* ฟอร์มโปรไฟล์ */}
          <section className="bg-white rounded-[1.6rem] p-6 md:p-7 shadow-soft border border-[color:var(--border)]">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
              <div>
                <h2 className="font-bold text-[16px]">📝 ข้อมูลโปรไฟล์</h2>
                <p className="text-[12px] text-ink-muted mt-0.5">กรอกให้ครบเพื่อให้หน้าเว็บแสดงข้อมูลถูกต้อง</p>
              </div>
              <span className="chip chip-accent">✨ แสดงบนหน้าเว็บสาธารณะ</span>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Head icon="👤" bg="bg-primary-soft">ข้อมูลส่วนตัว</Head>

              <div><label className="lbl req" htmlFor="p_name">ชื่อ–สกุล (พร้อมคำนำหน้า)</label>
                <input className="inp" id="p_name" name="full_name" required maxLength={150} defaultValue={p?.full_name ?? ''} /><span className="field-error"></span></div>
              <div><label className="lbl" htmlFor="p_nick">ชื่อที่ใช้เรียก (แสดงบนโลโก้)</label>
                <input className="inp" id="p_nick" name="nickname" maxLength={60} defaultValue={p?.nickname ?? ''} /><span className="field-error"></span></div>

              <div><label className="lbl" htmlFor="p_pos">ตำแหน่ง</label>
                <input className="inp" id="p_pos" name="position" maxLength={100} defaultValue={p?.position ?? ''} placeholder="ครู" /><span className="field-error"></span></div>
              <div><label className="lbl" htmlFor="p_std">วิทยฐานะ</label>
                <input className="inp" id="p_std" name="academic_standing" maxLength={100} defaultValue={p?.academic_standing ?? ''} placeholder="ครูชำนาญการ" /><span className="field-error"></span></div>

              <div className="md:col-span-2"><label className="lbl" htmlFor="p_grp">กลุ่มสาระการเรียนรู้</label>
                <input className="inp" id="p_grp" name="subject_group" maxLength={150} defaultValue={p?.subject_group ?? ''} /><span className="field-error"></span></div>

              <Head icon="🏫" bg="bg-mint-soft" pt>สถานศึกษาและสังกัด</Head>

              <div><label className="lbl" htmlFor="p_school">สถานศึกษา</label>
                <input className="inp" id="p_school" name="school" maxLength={150} defaultValue={p?.school ?? ''} /><span className="field-error"></span></div>
              <div><label className="lbl" htmlFor="p_aff">สังกัด</label>
                <input className="inp" id="p_aff" name="affiliation" maxLength={150} defaultValue={p?.affiliation ?? ''} /><span className="field-error"></span></div>

              <div className="md:col-span-2"><label className="lbl" htmlFor="p_area">สำนักงานเขตพื้นที่การศึกษา</label>
                <input className="inp" id="p_area" name="area_office" maxLength={150} defaultValue={p?.area_office ?? ''} /><span className="field-error"></span></div>

              <Head icon="📞" bg="bg-sky-soft" pt>ช่องทางติดต่อ</Head>

              <div><label className="lbl" htmlFor="p_email">อีเมล</label>
                <input className="inp" id="p_email" name="email" type="email" maxLength={120} defaultValue={p?.email ?? ''} /><span className="field-error"></span></div>
              <div><label className="lbl" htmlFor="p_phone">โทรศัพท์</label>
                <input className="inp" id="p_phone" name="phone" maxLength={40} defaultValue={p?.phone ?? ''} /><span className="field-error"></span></div>

              <div><label className="lbl" htmlFor="p_fb">Facebook</label>
                <input className="inp" id="p_fb" name="facebook" maxLength={150} defaultValue={p?.facebook ?? ''} /><span className="field-error"></span></div>
              <div><label className="lbl" htmlFor="p_line">Line ID</label>
                <input className="inp" id="p_line" name="line_id" maxLength={80} defaultValue={p?.line_id ?? ''} /><span className="field-error"></span></div>

              <Head icon="📊" bg="bg-sunny-soft" pt>ตัวเลขสถิติ (แสดงบนหน้าแรก)</Head>

              <div><label className="lbl" htmlFor="p_exp">ประสบการณ์ (ปี)</label>
                <input className="inp" id="p_exp" name="experience_years" type="number" min={0} max={60} defaultValue={Number(p?.experience_years ?? 0)} /><span className="field-error"></span></div>
              <div><label className="lbl" htmlFor="p_hours">ชั่วโมงสอน/สัปดาห์</label>
                <input className="inp" id="p_hours" name="teaching_hours" type="number" step="0.5" min={0} defaultValue={trimNum(p?.teaching_hours)} /><span className="field-error"></span></div>

              <Head icon="💬" bg="bg-coral-soft" pt>คำขวัญและแนะนำตัว</Head>

              <div className="md:col-span-2"><label className="lbl" htmlFor="p_motto">คำขวัญ (แสดงบน Hero หน้าแรก)</label>
                <input className="inp" id="p_motto" name="motto" maxLength={255} defaultValue={p?.motto ?? ''} /><span className="field-error"></span></div>
              <div className="md:col-span-2"><label className="lbl" htmlFor="p_phil">ปรัชญาการสอน</label>
                <input className="inp" id="p_phil" name="philosophy" maxLength={255} defaultValue={p?.philosophy ?? ''} /><span className="field-error"></span></div>

              <div className="md:col-span-2"><label className="lbl" htmlFor="p_bio">แนะนำตัว (bio)</label>
                <textarea className="inp" id="p_bio" name="bio" rows={5} defaultValue={p?.bio ?? ''} /><span className="field-error"></span></div>
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap mt-6 pt-5 border-t border-[color:var(--divider)]">
              <p className="text-[12px] text-ink-muted">รูปและจุดโฟกัสที่เลือกไว้จะถูกบันทึกพร้อมกับฟอร์มนี้</p>
              <SubmitButton>💾 บันทึกโปรไฟล์</SubmitButton>
            </div>
          </section>
        </div>
      </AjaxForm>

      <EducationSection rows={educs} />
      <CareerSection rows={careers} />
    </>
  )
}
