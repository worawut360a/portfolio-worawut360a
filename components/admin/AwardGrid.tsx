'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useAwardModal } from './AwardModal'
import { deleteAward } from '@/lib/item-actions'
import { confirmDelete, toastSuccess, alertError } from '@/lib/ui'

export interface AwardCard {
  id: number; title: string; level: string; awarder: string
  dateText: string; summary: string; note: string
  cover: string | null; coverFull: string | null
  hasContent: boolean; hasVideo: boolean
  images: number; files: number
}

const CHIP: Record<string, string> = {
  โรงเรียน: 'chip-1', เขตพื้นที่: 'chip-2', จังหวัด: 'chip-3',
  ภาค: 'chip-accent', ชาติ: 'chip-accent', นานาชาติ: 'chip-accent',
}

/** การ์ดรางวัลของหลังบ้าน — ยกมาจาก admin/awards.php */
export default function AwardGrid({ awards }: { awards: AwardCard[] }) {
  const router = useRouter()
  const { edit } = useAwardModal()
  const [, startTransition] = useTransition()

  async function remove(a: AwardCard) {
    if (!(await confirmDelete(a.title))) return
    try {
      const r = await deleteAward(a.id)
      if (!r.ok) { alertError(r.error || 'ลบไม่สำเร็จ'); return }
      toastSuccess(`ลบ “${a.title}” เรียบร้อยแล้ว`)
      startTransition(() => router.refresh())
    } catch {
      alertError('ลบไม่สำเร็จ')
    }
  }

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {awards.map((a) => (
        <article key={a.id} className="card-pop overflow-hidden group flex flex-col">
          <div className="relative">
            <a href={a.coverFull ?? '#'} target="_blank" rel="noreferrer"
              className="block aspect-[4/3] rounded-t-[inherit] overflow-hidden bg-[#EDF0F6]">
              {a.cover
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={a.cover} alt={a.title} loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                : <span className="w-full h-full grid place-items-center text-4xl">🏅</span>}
            </a>
            <span className={`absolute top-3 left-3 chip ${CHIP[a.level] ?? 'chip-accent'} shadow-soft`}>🏆 ระดับ{a.level}</span>
            <div className="absolute top-3 right-3 flex gap-1.5">
              <a className="icon-btn bg-white shadow-soft" href={`/award/${a.id}`} target="_blank" rel="noopener noreferrer"
                title="ดูหน้าเว็บ" aria-label="ดูหน้าเว็บ">👁️</a>
              <button type="button" className="icon-btn edit shadow-soft" title="แก้ไข" aria-label="แก้ไข"
                onClick={() => void edit(a.id)}>✏️</button>
              <button type="button" className="icon-btn del shadow-soft" title="ลบ" aria-label="ลบ"
                onClick={() => void remove(a)}>🗑️</button>
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col">
            <h3 className="text-[14.5px] font-bold leading-snug line-2">{a.title}</h3>
            <p className="mt-2 text-[12px] text-ink-muted flex items-center gap-x-2 gap-y-1 flex-wrap">
              {a.awarder && <><span className="inline-flex items-center gap-1">🏛️ {a.awarder}</span><span className="text-ink-faint">·</span></>}
              <span className="inline-flex items-center gap-1 whitespace-nowrap">📅 {a.dateText}</span>
            </p>
            {a.summary
              ? <p className="mt-2 text-[12px] text-ink-soft line-2">{a.summary}</p>
              : a.note ? <p className="mt-2 text-[11.5px] text-ink-faint line-2">{a.note}</p> : null}

            <div className="mt-auto pt-3 flex flex-wrap items-center gap-1.5">
              <span className={`chip !text-[10.5px] ${a.images ? 'chip-primary' : 'bg-[color:var(--divider)] text-ink-faint'}`} title="จำนวนรูปภาพ">🖼️ {a.images} รูป</span>
              <span className={`chip !text-[10.5px] ${a.files ? 'chip-2' : 'bg-[color:var(--divider)] text-ink-faint'}`} title="จำนวนไฟล์แนบ">📎 {a.files} ไฟล์</span>
              {a.hasContent && <span className="chip chip-accent !text-[10.5px]" title="มีเนื้อหารายละเอียด">📝 มีรายละเอียด</span>}
              {a.hasVideo && <span className="chip chip-3 !text-[10.5px]" title="มีวิดีโอ">🎬 วิดีโอ</span>}
              <a href={`/award/${a.id}`} target="_blank" rel="noopener noreferrer"
                className="btn btn-white btn-sm ml-auto !text-[11.5px]">👁️ ดูหน้าเว็บ</a>
            </div>
          </div>
        </article>
      ))}

      {awards.length === 0 && (
        <div className="sm:col-span-2 xl:col-span-3 bg-white rounded-[1.6rem] p-14 text-center shadow-soft border border-[color:var(--border)]">
          <div className="text-5xl mb-3">🏅</div>
          <p className="text-[13px] text-ink-muted">ยังไม่มีรางวัล · กด “+ เพิ่มรางวัล” ด้านบนเพื่อเริ่มต้น</p>
        </div>
      )}
    </div>
  )
}
