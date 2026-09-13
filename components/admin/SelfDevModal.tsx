'use client'

import { createContext, useContext, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Modal from './Modal'
import DriveLinkInput from './DriveLinkInput'
import { ImageSection, FileSection, type ImageRow, type FileRow } from './MediaEditor'
import SectionHead from './ModalSectionHead'
import { getSelfDevForEdit, saveSelfDev } from '@/lib/item-actions'
import { toastSuccess, toastError, alertError, fireConfetti } from '@/lib/ui'
import type { MediaSource } from '@/lib/media'

export const DEV_TYPES = ['อบรม', 'สัมมนา', 'ศึกษาดูงาน', 'PLC', 'วิทยากร'] as const

interface Draft {
  id: number; title: string; organizer: string; type: string
  start_date: string; end_date: string; hours: string; fiscal_year: number
  certificate_source: MediaSource | null; certificate_ref: string | null
  note: string; summary: string; content: string
  video_url: string; link_url: string; link_label: string
  images: ImageRow[]; files: FileRow[]
  existing: boolean
}

const blank = (fy: number): Draft => ({
  id: 0, title: '', organizer: '', type: 'อบรม', start_date: '', end_date: '',
  hours: '', fiscal_year: fy, certificate_source: null, certificate_ref: null,
  note: '', summary: '', content: '', video_url: '', link_url: '', link_label: '',
  images: [], files: [], existing: false,
})

interface Api { add: () => void; edit: (id: number) => void }
const Ctx = createContext<Api | null>(null)

export const useSelfDevModal = () => {
  const api = useContext(Ctx)
  if (!api) throw new Error('ต้องอยู่ใน <SelfDevProvider>')
  return api
}

/**
 * โมดัลเพิ่ม/แก้ไขการพัฒนาตนเอง — ยกมาจาก modalSD ของ admin/self-dev.php
 *
 * ต่างจากเว็บ PHP ตรงที่เกียรติบัตร รูป และไฟล์แนบใช้ “วางลิงก์ Google Drive”
 * แทนการอัปโหลด จึงเพิ่มได้ตั้งแต่ตอนสร้างรายการ ไม่ต้องบันทึกก่อนเหมือนเดิม
 */
export function SelfDevProvider({
  fiscalYear, children,
}: { fiscalYear: number; children: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [d, setD] = useState<Draft>(blank(fiscalYear))
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [, startTransition] = useTransition()

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }))

  const add = () => { setD(blank(fiscalYear)); setErr(''); setOpen(true) }

  const edit = async (id: number) => {
    setD(blank(fiscalYear)); setErr(''); setOpen(true); setLoading(true)
    try {
      const r = await getSelfDevForEdit(id)
      if (!r) { alertError('ไม่พบรายการที่ต้องการแก้ไข'); setOpen(false); return }
      setD({ ...r, hours: String(r.hours), existing: true })
    } catch {
      alertError('โหลดข้อมูลรายการไม่สำเร็จ')
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  async function submit(f: FormData) {
    setBusy(true)
    try {
      const isNew = !d.id
      const r = await saveSelfDev(f)
      if (!r.ok) { setErr(r.error); toastError(r.error); return }
      if (isNew) fireConfetti()
      toastSuccess(isNew ? 'เพิ่มรายการสำเร็จ!' : 'บันทึกรายการสำเร็จ!')
      setOpen(false)
      startTransition(() => router.refresh())
    } finally {
      setBusy(false)
    }
  }

  return (
    <Ctx.Provider value={{ add, edit }}>
      {children}

      <Modal open={open} onClose={() => setOpen(false)} maxWidth={720}
        title={d.existing ? '✏️ แก้ไขรายการพัฒนาตนเอง' : '🌱 เพิ่มรายการพัฒนาตนเอง'}>
        <form action={submit} autoComplete="off">
          <input type="hidden" name="id" value={d.id} />
          <input type="hidden" name="images" value={JSON.stringify(d.images)} />
          <input type="hidden" name="files" value={JSON.stringify(d.files)} />

          <div className="modal-body">
            {loading ? (
              <p className="py-16 text-center text-ink-muted text-[13px]">
                <span className="spin inline-block mr-1">⏳</span> กำลังโหลด…
              </p>
            ) : (
              <>
                {/* ══════════ ข้อมูลหลัก ══════════ */}
                <SectionHead icon="📋" bg="bg-primary-soft">ข้อมูลหลัก</SectionHead>

                <div className="mb-4">
                  <label className="lbl req" htmlFor="s_title">ชื่อหลักสูตร / กิจกรรม</label>
                  <input className="inp" id="s_title" name="title" required maxLength={255}
                    placeholder="เช่น การอบรมเชิงปฏิบัติการ…"
                    value={d.title} onChange={(e) => set('title', e.target.value)} />
                  <span className="field-error">{err}</span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="lbl" htmlFor="s_org">หน่วยงานที่จัด</label>
                    <input className="inp" id="s_org" name="organizer" maxLength={200}
                      placeholder="สพฐ. / สพม. / มหาวิทยาลัย…"
                      value={d.organizer} onChange={(e) => set('organizer', e.target.value)} />
                    <span className="field-error"></span>
                  </div>
                  <div>
                    <label className="lbl" htmlFor="s_type">ประเภท</label>
                    <select className="inp" id="s_type" name="type"
                      value={d.type} onChange={(e) => set('type', e.target.value)}>
                      {DEV_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span className="field-error"></span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="lbl req" htmlFor="s_start">วันที่เริ่ม</label>
                    <input className="inp" id="s_start" name="start_date" type="date" required
                      value={d.start_date} onChange={(e) => set('start_date', e.target.value)} />
                    <span className="field-error"></span>
                  </div>
                  <div>
                    <label className="lbl" htmlFor="s_end">วันที่สิ้นสุด</label>
                    <input className="inp" id="s_end" name="end_date" type="date"
                      value={d.end_date} onChange={(e) => set('end_date', e.target.value)} />
                    <span className="field-error"></span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="lbl req" htmlFor="s_hours">จำนวนชั่วโมง</label>
                    <input className="inp" id="s_hours" name="hours" type="number" required min={0} max={2000}
                      placeholder="0" value={d.hours} onChange={(e) => set('hours', e.target.value)} />
                    <span className="field-error"></span>
                  </div>
                  <div>
                    <label className="lbl req" htmlFor="s_fy">ปีงบประมาณ (พ.ศ.)</label>
                    <input className="inp" id="s_fy" name="fiscal_year" type="number" required min={2500} max={2700}
                      value={d.fiscal_year} onChange={(e) => set('fiscal_year', Number(e.target.value))} />
                    <span className="field-error"></span>
                  </div>
                </div>

                <div className="mb-5">
                  <label className="lbl" htmlFor="s_note">หมายเหตุ</label>
                  <input className="inp" id="s_note" name="note" maxLength={400}
                    placeholder="ข้อความสั้น ๆ ใต้ชื่อหลักสูตรในตาราง"
                    value={d.note} onChange={(e) => set('note', e.target.value)} />
                  <span className="field-error"></span>
                </div>

                {/* ══════════ รายละเอียด ══════════ */}
                <SectionHead icon="📝" bg="bg-mint-soft"
                  extra="(แสดงบนหน้ารายละเอียดของรายการนี้)">รายละเอียด</SectionHead>

                <div className="mb-4">
                  <label className="lbl" htmlFor="s_summary">คำโปรย / สรุปสั้น</label>
                  <input className="inp" id="s_summary" name="summary" maxLength={500}
                    placeholder="สรุปสั้น ๆ 1–2 บรรทัด ว่าได้เรียนรู้อะไร"
                    value={d.summary} onChange={(e) => set('summary', e.target.value)} />
                  <span className="field-error"></span>
                </div>

                <div className="mb-5">
                  <label className="lbl" htmlFor="s_content">รายละเอียด</label>
                  <textarea className="inp font-mono text-[12.5px]" id="s_content" name="content" rows={8}
                    placeholder="<h3>🎯 เนื้อหาที่อบรม</h3><p>…</p><h3>🌟 การนำไปใช้ในชั้นเรียน</h3><ul><li>…</li></ul>"
                    value={d.content} onChange={(e) => set('content', e.target.value)} />
                  <span className="field-error"></span>
                  <p className="text-[11.5px] text-ink-muted mt-1.5">
                    รองรับ HTML อย่างง่าย: <code className="bg-[color:var(--divider)] rounded px-1">&lt;h3&gt; &lt;p&gt; &lt;ul&gt; &lt;li&gt; &lt;b&gt;</code>
                    {' '}· เว้นว่างได้ถ้ายังไม่มีข้อมูล
                  </p>
                </div>

                {/* ══════════ สื่อและลิงก์ ══════════ */}
                <SectionHead icon="🔗" bg="bg-sky-soft">สื่อและลิงก์</SectionHead>

                <div className="mb-4">
                  <label className="lbl" htmlFor="s_video">ลิงก์วิดีโอ (YouTube)</label>
                  <input className="inp" id="s_video" name="video_url" maxLength={255}
                    placeholder="https://www.youtube.com/watch?v=…"
                    value={d.video_url} onChange={(e) => set('video_url', e.target.value)} />
                  <span className="field-error"></span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="lbl" htmlFor="s_link">ลิงก์ที่เกี่ยวข้อง</label>
                    <input className="inp" id="s_link" name="link_url" maxLength={255} placeholder="https://…"
                      value={d.link_url} onChange={(e) => set('link_url', e.target.value)} />
                    <span className="field-error"></span>
                  </div>
                  <div>
                    <label className="lbl" htmlFor="s_linklabel">ข้อความบนปุ่มลิงก์</label>
                    <input className="inp" id="s_linklabel" name="link_label" maxLength={120}
                      placeholder="เช่น เปิดหลักสูตรออนไลน์"
                      value={d.link_label} onChange={(e) => set('link_label', e.target.value)} />
                    <span className="field-error"></span>
                  </div>
                </div>

                <div className="bg-primary-soft/60 rounded-2xl p-4 mb-5">
                  <label className="lbl flex items-center gap-2" htmlFor="s_cert">
                    <span className="text-lg">📜</span>เกียรติบัตร (ลิงก์ PDF หรือรูปภาพจาก Google Drive)
                  </label>
                  <DriveLinkInput key={d.id} name="cert" id="s_cert"
                    defaultSource={d.certificate_source} defaultRef={d.certificate_ref} />
                  <p className="text-[11.5px] text-ink-muted mt-2">
                    วางลิงก์แชร์จาก Google Drive · ตั้งค่าไฟล์เป็น “ทุกคนที่มีลิงก์” ก่อน ไม่งั้นเปิดดูไม่ได้
                  </p>
                </div>

                {/* ══════════ รูปภาพและไฟล์แนบ ══════════ */}
                <SectionHead icon="📎" bg="bg-sunny-soft">แกลเลอรีรูปและไฟล์แนบ</SectionHead>

                <ImageSection rows={d.images} onChange={(rows) => set('images', rows)}
                  label="รูปภาพประกอบ (วางลิงก์แชร์จาก Google Drive · เพิ่มได้หลายรูป)"
                  hint="เพิ่มได้ทีละรูป · ลากจัดลำดับได้ภายหลัง" />
                <FileSection rows={d.files} onChange={(rows) => set('files', rows)}
                  label="ไฟล์แนบ (วางลิงก์แชร์จาก Google Drive · pdf, docx, xlsx, pptx, zip)" />
              </>
            )}
          </div>

          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary" disabled={busy || loading}>
              {busy ? 'กำลังบันทึก…' : '💾 บันทึก'}
            </button>
          </div>
        </form>
      </Modal>
    </Ctx.Provider>
  )
}

/** ปุ่ม “+ เพิ่มรายการ” — วางกี่จุดก็ได้ ใช้โมดัลกล่องเดียวกัน */
export function NewSelfDevButton({ className, children }: { className: string; children: React.ReactNode }) {
  const { add } = useSelfDevModal()
  return <button type="button" className={className} onClick={add}>{children}</button>
}
