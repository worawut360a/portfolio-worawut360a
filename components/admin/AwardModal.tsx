'use client'

import { createContext, useContext, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Modal from './Modal'
import DriveLinkInput from './DriveLinkInput'
import SectionHead from './ModalSectionHead'
import { ImageSection, FileSection, type ImageRow, type FileRow } from './MediaEditor'
import { getAwardForEdit, saveAward } from '@/lib/item-actions'
import { toastSuccess, toastError, alertError, fireConfetti } from '@/lib/ui'
import type { MediaSource } from '@/lib/media'

export const LEVELS = ['โรงเรียน', 'เขตพื้นที่', 'จังหวัด', 'ภาค', 'ชาติ', 'นานาชาติ'] as const

interface Draft {
  id: number; title: string; awarder: string; level: string; award_date: string
  image_source: MediaSource | null; image_ref: string | null
  note: string; summary: string; content: string
  video_url: string; link_url: string; link_label: string
  images: ImageRow[]; files: FileRow[]
  existing: boolean
}

const BLANK: Draft = {
  id: 0, title: '', awarder: '', level: 'โรงเรียน', award_date: '',
  image_source: null, image_ref: null, note: '', summary: '', content: '',
  video_url: '', link_url: '', link_label: '', images: [], files: [], existing: false,
}

interface Api { add: () => void; edit: (id: number) => void }
const Ctx = createContext<Api | null>(null)

export const useAwardModal = () => {
  const api = useContext(Ctx)
  if (!api) throw new Error('ต้องอยู่ใน <AwardProvider>')
  return api
}

/**
 * โมดัลเพิ่ม/แก้ไขรางวัล — ยกมาจาก modalAward ของ admin/awards.php
 *
 * ต่างจากเว็บ PHP ตรงที่รูปปก รูปในแกลเลอรี และไฟล์แนบใช้ “วางลิงก์ Google Drive”
 * แทนการอัปโหลด จึงเพิ่มได้ตั้งแต่ตอนสร้างรายการ ไม่ต้องบันทึกก่อนเหมือนเดิม
 */
export function AwardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [d, setD] = useState<Draft>(BLANK)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [, startTransition] = useTransition()

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }))

  const add = () => { setD(BLANK); setErr(''); setOpen(true) }

  const edit = async (id: number) => {
    setD(BLANK); setErr(''); setOpen(true); setLoading(true)
    try {
      const r = await getAwardForEdit(id)
      if (!r) { alertError('ไม่พบรางวัลที่ต้องการแก้ไข'); setOpen(false); return }
      setD({ ...r, existing: true })
    } catch {
      alertError('โหลดข้อมูลรางวัลไม่สำเร็จ')
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  async function submit(f: FormData) {
    setBusy(true)
    try {
      const isNew = !d.id
      const r = await saveAward(f)
      if (!r.ok) { setErr(r.error); toastError(r.error); return }
      if (isNew) fireConfetti()
      toastSuccess(isNew ? 'เพิ่มรางวัลสำเร็จ!' : 'บันทึกรางวัลสำเร็จ!')
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
        title={d.existing ? '✏️ แก้ไขรางวัล' : '🏅 เพิ่มรางวัล'}>
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
                  <label className="lbl req" htmlFor="aw_title">ชื่อรางวัล</label>
                  <input className="inp" id="aw_title" name="title" required maxLength={255}
                    placeholder="เช่น ครูดีในดวงใจ"
                    value={d.title} onChange={(e) => set('title', e.target.value)} />
                  <span className="field-error">{err}</span>
                </div>

                <div className="mb-4">
                  <label className="lbl" htmlFor="aw_by">หน่วยงานที่มอบ</label>
                  <input className="inp" id="aw_by" name="awarder" maxLength={200}
                    placeholder="สพฐ. / สพม. / คุรุสภา…"
                    value={d.awarder} onChange={(e) => set('awarder', e.target.value)} />
                  <span className="field-error"></span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="lbl" htmlFor="aw_level">ระดับรางวัล</label>
                    <select className="inp" id="aw_level" name="level"
                      value={d.level} onChange={(e) => set('level', e.target.value)}>
                      {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <span className="field-error"></span>
                  </div>
                  <div>
                    <label className="lbl req" htmlFor="aw_date">วันที่ได้รับ</label>
                    <input className="inp" id="aw_date" name="award_date" type="date" required
                      value={d.award_date} onChange={(e) => set('award_date', e.target.value)} />
                    <span className="field-error"></span>
                  </div>
                </div>

                <div className="mb-5">
                  <label className="lbl" htmlFor="aw_note">หมายเหตุ</label>
                  <input className="inp" id="aw_note" name="note" maxLength={400}
                    placeholder="ข้อความสั้น ๆ ใต้ชื่อรางวัลบนการ์ด"
                    value={d.note} onChange={(e) => set('note', e.target.value)} />
                  <span className="field-error"></span>
                </div>

                {/* ══════════ รายละเอียด ══════════ */}
                <SectionHead icon="📝" bg="bg-mint-soft" extra="(แสดงบนหน้ารายละเอียดรางวัล)">รายละเอียด</SectionHead>

                <div className="mb-4">
                  <label className="lbl" htmlFor="aw_summary">คำโปรย / สรุปสั้น</label>
                  <input className="inp" id="aw_summary" name="summary" maxLength={500}
                    placeholder="สรุปสั้น ๆ 1–2 บรรทัด แสดงใต้ชื่อรางวัล"
                    value={d.summary} onChange={(e) => set('summary', e.target.value)} />
                  <span className="field-error"></span>
                </div>

                <div className="mb-5">
                  <label className="lbl" htmlFor="aw_content">รายละเอียด</label>
                  <textarea className="inp font-mono text-[12.5px]" id="aw_content" name="content" rows={8}
                    placeholder="<h3>🏆 ที่มาของรางวัล</h3><p>…</p><h3>🌟 ผลงานที่ส่งเข้าประกวด</h3><ul><li>…</li></ul>"
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
                  <label className="lbl" htmlFor="aw_video">ลิงก์วิดีโอ (YouTube)</label>
                  <input className="inp" id="aw_video" name="video_url" maxLength={255}
                    placeholder="https://www.youtube.com/watch?v=…"
                    value={d.video_url} onChange={(e) => set('video_url', e.target.value)} />
                  <span className="field-error"></span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="lbl" htmlFor="aw_link">ลิงก์ที่เกี่ยวข้อง</label>
                    <input className="inp" id="aw_link" name="link_url" maxLength={255} placeholder="https://…"
                      value={d.link_url} onChange={(e) => set('link_url', e.target.value)} />
                    <span className="field-error"></span>
                  </div>
                  <div>
                    <label className="lbl" htmlFor="aw_linklabel">ข้อความบนปุ่มลิงก์</label>
                    <input className="inp" id="aw_linklabel" name="link_label" maxLength={120}
                      placeholder="เช่น อ่านข่าวประชาสัมพันธ์"
                      value={d.link_label} onChange={(e) => set('link_label', e.target.value)} />
                    <span className="field-error"></span>
                  </div>
                </div>

                <div className="bg-primary-soft/60 rounded-2xl p-4 mb-5">
                  <label className="lbl flex items-center gap-2" htmlFor="aw_img">
                    <span className="text-lg">🖼️</span>รูปปก (ลิงก์เกียรติบัตร / ภาพรับรางวัล จาก Google Drive)
                  </label>
                  <DriveLinkInput key={d.id} name="image" id="aw_img" thumb
                    defaultSource={d.image_source} defaultRef={d.image_ref} />
                  <p className="text-[11.5px] text-ink-muted mt-2">
                    วางลิงก์แชร์จาก Google Drive · ถ้าเว้นว่างไว้แต่มีรูปในแกลเลอรีด้านล่าง รูปแรกจะกลายเป็นปกโดยอัตโนมัติ
                  </p>
                </div>

                {/* ══════════ รูปภาพและไฟล์แนบ ══════════ */}
                <SectionHead icon="📎" bg="bg-sunny-soft">แกลเลอรีรูปและไฟล์แนบ</SectionHead>

                <ImageSection rows={d.images} onChange={(rows) => set('images', rows)} coverBadge
                  label="รูปภาพประกอบ (วางลิงก์แชร์จาก Google Drive · เพิ่มได้หลายรูป)"
                  hint="เพิ่มได้ทีละรูป · รูปแรกจะกลายเป็นภาพปกถ้ายังไม่ได้ใส่รูปปก" />
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

/** ปุ่ม “+ เพิ่มรางวัล” — วางกี่จุดก็ได้ ใช้โมดัลกล่องเดียวกัน */
export function NewAwardButton({ className, children }: { className: string; children: React.ReactNode }) {
  const { add } = useAwardModal()
  return <button type="button" className={className} onClick={add}>{children}</button>
}
