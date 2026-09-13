'use client'

import { createContext, useContext, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Modal from './Modal'
import { saveChallenge } from '@/app/admin/pa/actions'
import { toastSuccess, toastError } from '@/lib/ui'
import type { PaChallenge } from '@/lib/types'

interface Draft {
  id: number; topic: string; problem_statement: string; method: string
  expected_outcome: string; title: string
}
const EMPTY: Draft = {
  id: 0, topic: '', problem_statement: '', method: '', expected_outcome: '',
  title: '🎯 เพิ่มประเด็นท้าทาย',
}

const Ctx = createContext<((d: Draft) => void) | null>(null)

/** โมดัล “ประเด็นท้าทาย” ของตอนที่ 3 — กล่องเดียว ใช้ทั้งเพิ่มและแก้ไข */
export function ChallengeProvider({
  agreementId, children,
}: { agreementId: number; children: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [d, setD] = useState<Draft>(EMPTY)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [, startTransition] = useTransition()

  async function submit(f: FormData) {
    setBusy(true)
    try {
      const r = await saveChallenge(f)
      if (!r.ok) { setErr(r.error); toastError(r.error); return }
      toastSuccess('บันทึกตอนที่ 3 สำเร็จ!')
      setOpen(false)
      startTransition(() => router.refresh())
    } finally {
      setBusy(false)
    }
  }

  return (
    <Ctx.Provider value={(draft) => { setD(draft); setErr(''); setOpen(true) }}>
      {children}

      <Modal open={open} onClose={() => setOpen(false)} title={d.title} maxWidth={680}>
        <form action={submit} autoComplete="off">
          <input type="hidden" name="id" value={d.id} />
          <input type="hidden" name="agreement_id" value={agreementId} />
          <div className="modal-body">
            <div className="mb-4">
              <label className="lbl req" htmlFor="ch_topic">ชื่อประเด็นท้าทาย</label>
              <input className="inp" id="ch_topic" name="topic" required maxLength={300}
                value={d.topic} onChange={(e) => setD({ ...d, topic: e.target.value })} />
              <span className="field-error">{err}</span>
            </div>
            <div className="mb-4">
              <label className="lbl req" htmlFor="ch_prob">สภาพปัญหา</label>
              <textarea className="inp" id="ch_prob" name="problem_statement" required rows={3}
                value={d.problem_statement} onChange={(e) => setD({ ...d, problem_statement: e.target.value })} />
              <span className="field-error"></span>
            </div>
            <div className="mb-4">
              <label className="lbl req" htmlFor="ch_method">วิธีดำเนินการ</label>
              <textarea className="inp" id="ch_method" name="method" required rows={3}
                value={d.method} onChange={(e) => setD({ ...d, method: e.target.value })} />
              <span className="field-error"></span>
            </div>
            <div>
              <label className="lbl req" htmlFor="ch_out">ผลลัพธ์ที่คาดหวัง</label>
              <textarea className="inp" id="ch_out" name="expected_outcome" required rows={3}
                value={d.expected_outcome} onChange={(e) => setD({ ...d, expected_outcome: e.target.value })} />
              <span className="field-error"></span>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'กำลังบันทึก…' : '💾 บันทึก'}</button>
          </div>
        </form>
      </Modal>
    </Ctx.Provider>
  )
}

const useOpen = () => {
  const fn = useContext(Ctx)
  if (!fn) throw new Error('ต้องอยู่ใน <ChallengeProvider>')
  return fn
}

export function NewChallengeButton() {
  const open = useOpen()
  return (
    <button type="button" className="btn btn-primary btn-sm" onClick={() => open(EMPTY)}>
      + เพิ่มประเด็นท้าทาย
    </button>
  )
}

export function EditChallengeButton({ challenge }: { challenge: PaChallenge }) {
  const open = useOpen()
  return (
    <button type="button" className="icon-btn edit w-10 h-10" title="แก้ไข" aria-label="แก้ไขประเด็นท้าทาย"
      onClick={() => open({
        id: challenge.id,
        topic: challenge.topic ?? '',
        problem_statement: challenge.problem_statement ?? '',
        method: challenge.method ?? '',
        expected_outcome: challenge.expected_outcome ?? '',
        title: '✏️ แก้ไขประเด็นท้าทาย',
      })}>
      ✏️
    </button>
  )
}
