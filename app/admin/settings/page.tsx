import { requireAdmin } from '@/lib/auth'
import { all, one } from '@/lib/db'
import { getSetting } from '@/lib/queries'
import { isSiteTheme, thaiDate, excerpt } from '@/lib/theme'
import PageHead from '@/components/admin/PageHead'
import AjaxForm, { SubmitButton } from '@/components/admin/AjaxForm'
import ThemePicker, { type ThemeOption } from '@/components/admin/ThemePicker'
import RecoveryPanel from '@/components/admin/RecoveryPanel'
import { hasRecoveryCode } from '@/lib/recovery'
import { changePassword } from './actions'

/**
 * 3 ธีมสี — สี ชื่อ และคำอธิบายยกมาจาก admin/settings.php ทั้งหมด
 * (คีย์ของ PHP คือ pink | mint | lavender เวอร์ชันนี้ใช้ emerald | royal | maroon)
 */
const THEMES: ThemeOption[] = [
  { key: 'emerald', name: 'Emerald & Gold', desc: 'เขียวมรกต–ทอง สุขุม น่าเชื่อถือ (ค่าเริ่มต้น)',
    c1: '#0B6E4F', c2: '#12A06F', bg: '#F5FBF8', soft: '#E1F4EC' },
  { key: 'royal', name: 'Royal Blue', desc: 'น้ำเงินสด–ฟ้า สะอาดตา ดูกระฉับกระเฉง',
    c1: '#1D4ED8', c2: '#0EA5E9', bg: '#F5F8FD', soft: '#E6EEFF' },
  { key: 'maroon', name: 'Maroon & Gold', desc: 'แดงเลือดหมู–ทอง ขรึม ดูเป็นทางการ',
    c1: '#8C1D3F', c2: '#C0355F', bg: '#FDF7F9', soft: '#FAE7ED' },
]

/** สี chip ตามชนิดการกระทำ (ตกแต่งอย่างเดียว) */
function actionChip(action: string): string {
  if (action.startsWith('เพิ่ม')) return 'chip-2'
  if (action.startsWith('ลบ')) return 'chip-1'
  if (action.startsWith('แก้ไข') || action.startsWith('อัปเดต') || action.startsWith('บันทึก')) return 'chip-accent'
  if (action.startsWith('เข้าสู่ระบบ')) return 'chip-3'
  if (action.startsWith('ออกจากระบบ')) return 'chip-ink'
  if (action.startsWith('เปลี่ยนรหัสผ่าน')) return 'chip-grad'
  return 'chip-primary'
}

interface LogRow {
  id: number; action: string; table_name: string; detail: string; ip: string; created_at: string
}

/** วันที่ไทยแบบเต็ม — ตรงกับ thai_date_full() ของเว็บ PHP */
function thaiToday(): string {
  const d = new Date()
  const day = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'][d.getDay()]
  const month = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                 'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'][d.getMonth()]
  return `วัน${day}ที่ ${d.getDate()} ${month} ${d.getFullYear() + 543}`
}

const th = (n: unknown) => Number(n ?? 0).toLocaleString('th-TH')

/** ตั้งค่าระบบ — แปลงจาก admin/settings.php */
export default async function SettingsAdmin() {
  await requireAdmin()   // ต้องตรวจในทุกหน้า ไม่ใช่แค่ layout — Next render layout กับ page พร้อมกัน

  const [themeRaw, user, logs, totals, hasRecovery] = await Promise.all([
    getSetting('theme'),
    one<{ username: string }>('SELECT username FROM users ORDER BY id LIMIT 1'),
    all<LogRow>('SELECT * FROM activity_log ORDER BY id DESC LIMIT 40'),
    one<{ works: number; images: number; views: number }>(`
      SELECT
        (SELECT COUNT(*) FROM works WHERE deleted_at IS NULL) AS works,
        (SELECT COUNT(*) FROM work_images) + (SELECT COUNT(*) FROM item_images) AS images,
        (SELECT COALESCE(SUM(view_count),0) FROM works WHERE deleted_at IS NULL) AS views`),
    hasRecoveryCode(),
  ])
  const theme = isSiteTheme(themeRaw) ? themeRaw : 'royal'

  const dbUrl = process.env.TURSO_DATABASE_URL ?? ''
  const info: [string, string][] = [
    ['Node.js', process.version],
    ['ฐานข้อมูล', dbUrl.startsWith('file:') ? 'SQLite (ไฟล์บนเครื่อง)' : 'Turso (libSQL) บนคลาวด์'],
    ['ที่เก็บรูปและไฟล์', 'Google Drive (ลิงก์แชร์)'],
    ['โหมดการทำงาน', process.env.NODE_ENV === 'production' ? 'ใช้งานจริง (production)' : 'กำลังพัฒนา (development)'],
    ['ผลงานทั้งหมด', `${th(totals?.works)} ชิ้น`],
    ['รูปภาพทั้งหมด', `${th(totals?.images)} รูป`],
    ['ยอดเข้าชมรวม', `${th(totals?.views)} ครั้ง`],
    ['เขตเวลา', `${Intl.DateTimeFormat().resolvedOptions().timeZone} (${thaiToday()})`],
  ]

  return (
    <>
      <PageHead title="ตั้งค่าระบบ ⚙️" sub="บัญชีผู้ดูแล · ข้อมูลระบบ · บันทึกการใช้งาน" />

      {/* ================= ธีมสีของเว็บไซต์ ================= */}
      <section className="mt-5 bg-white rounded-[1.6rem] p-6 shadow-soft border border-[color:var(--border)]">
        <ThemePicker themes={THEMES} current={theme} />
      </section>

      <div className="mt-4 grid lg:grid-cols-2 gap-4">

        {/* ================= เปลี่ยนรหัสผ่าน ================= */}
        <section className="bg-white rounded-[1.6rem] p-6 shadow-soft border border-[color:var(--border)]">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-coral-soft grid place-items-center text-xl shrink-0">🔐</span>
            <div>
              <h2 className="font-bold text-[16px]">เปลี่ยนรหัสผ่าน</h2>
              <p className="text-[12px] text-ink-muted mt-0.5">
                บัญชี: <b className="text-ink">{user?.username ?? '—'}</b> · เข้ารหัสด้วย BCRYPT
              </p>
            </div>
          </div>

          <AjaxForm action={changePassword} successMsg="เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" resetOnSuccess className="mt-5">
            <div className="mb-4">
              <label className="lbl req" htmlFor="cur">รหัสผ่านปัจจุบัน</label>
              <input className="inp" id="cur" name="current_password" type="password" required autoComplete="current-password" />
              <span className="field-error"></span>
            </div>
            <div className="mb-4">
              <label className="lbl req" htmlFor="np">รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)</label>
              <input className="inp" id="np" name="new_password" type="password" required minLength={8} autoComplete="new-password" />
              <span className="field-error"></span>
            </div>
            <div className="mb-4">
              <label className="lbl req" htmlFor="cp">ยืนยันรหัสผ่านใหม่</label>
              <input className="inp" id="cp" name="confirm_password" type="password" required minLength={8} autoComplete="new-password" />
              <span className="field-error"></span>
            </div>

            <p className="mb-4 rounded-2xl bg-primary-soft text-primary-deep px-3.5 py-2.5 text-[12px] leading-relaxed">
              💡 แนะนำให้ผสมตัวอักษรใหญ่-เล็ก ตัวเลข และสัญลักษณ์ เพื่อความปลอดภัยของแฟ้มผลงาน
            </p>
            <SubmitButton className="btn btn-primary w-full">💾 เปลี่ยนรหัสผ่าน</SubmitButton>
          </AjaxForm>

          <RecoveryPanel has={hasRecovery} />
        </section>

        {/* ================= ข้อมูลระบบ ================= */}
        <section className="bg-white rounded-[1.6rem] p-6 shadow-soft border border-[color:var(--border)]">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-mint-soft grid place-items-center text-xl shrink-0">🩺</span>
            <div>
              <h2 className="font-bold text-[16px]">ข้อมูลระบบ</h2>
              <p className="text-[12px] text-ink-muted mt-0.5">สถานะเซิร์ฟเวอร์และตัวเลขสรุปของแฟ้ม</p>
            </div>
          </div>

          <dl className="mt-5 text-[13px] flex flex-col">
            {info.map(([k, v]) => (
              <div key={k} className="flex justify-between items-start gap-3 py-2.5 border-b border-dashed border-primary-line/60 last:border-0 hover:bg-primary-soft/40 rounded-lg px-2 -mx-2 transition">
                <dt className="text-ink-muted">{k}</dt>
                <dd className="font-bold text-right text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {/* ================= บันทึกการใช้งาน ================= */}
      <section className="mt-4 bg-white rounded-[1.6rem] p-6 shadow-soft border border-[color:var(--border)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-sunny-soft grid place-items-center text-xl shrink-0">📜</span>
            <div>
              <h2 className="font-bold text-[16px]">บันทึกการใช้งานล่าสุด</h2>
              <p className="text-[12px] text-ink-muted mt-0.5">แสดง 40 รายการล่าสุด</p>
            </div>
          </div>
          <span className="chip chip-primary">{logs.length} รายการ</span>
        </div>

        {logs.length > 0 ? (
          <div className="overflow-x-auto mt-4">
            <table className="adm-table min-w-[640px] md:min-w-0">
              <thead><tr><th className="col-no">#</th><th>เวลา</th><th>การกระทำ</th><th>ตาราง</th><th>รายละเอียด</th><th>IP</th></tr></thead>
              <tbody>
                {logs.map((l, i) => (
                  <tr key={l.id}>
                    <td className="col-no" data-label="ลำดับ">{i + 1}</td>
                    <td data-label="เวลา" className="whitespace-nowrap text-ink-soft">
                      {thaiDate(String(l.created_at).slice(0, 10))}{' '}
                      <span className="text-ink-faint">{String(l.created_at).slice(11, 16)}</span>
                    </td>
                    <td data-label="การกระทำ"><span className={`chip ${actionChip(l.action)}`}>{l.action}</span></td>
                    <td data-label="ตาราง" className="text-ink-muted"><code className="text-[12px]">{l.table_name}</code></td>
                    <td data-label="รายละเอียด">{excerpt(l.detail, 60) || '—'}</td>
                    <td data-label="IP" className="text-ink-faint text-[12px]">{l.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="text-5xl float">📜</div>
            <p className="mt-3 text-[13px] text-ink-muted">ยังไม่มีบันทึกการใช้งาน</p>
          </div>
        )}
      </section>
    </>
  )
}
