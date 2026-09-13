'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveTheme } from '@/app/admin/settings/actions'
import { toastSuccess, alertError } from '@/lib/ui'

export interface ThemeOption {
  key: string; name: string; desc: string
  c1: string; c2: string; bg: string; soft: string
}

/**
 * การ์ดเลือกธีมสี — ยกมาจาก admin/settings.php
 * คลิกแล้วเปลี่ยนสีทั้งเว็บทันที (สลับ data-theme ที่ <html>) แล้วค่อยบันทึกลงฐานข้อมูล
 * ถ้าบันทึกไม่สำเร็จจะย้อนสีกลับให้ตรงกับของจริงเสมอ
 */
export default function ThemePicker({
  themes, current,
}: { themes: ThemeOption[]; current: string }) {
  const router = useRouter()
  const [cur, setCur] = useState(current)
  const [saving, setSaving] = useState(false)
  const [, startTransition] = useTransition()

  async function choose(t: ThemeOption) {
    if (saving || cur === t.key) return
    setSaving(true)

    const prev = cur
    document.documentElement.dataset.theme = t.key   // พรีวิวทันที
    setCur(t.key)

    try {
      const r = await saveTheme(t.key)
      if (!r.ok) throw new Error(r.error)
      toastSuccess('เปลี่ยนธีมเรียบร้อยแล้ว 🎨')
      startTransition(() => router.refresh())
    } catch (e) {
      document.documentElement.dataset.theme = prev   // ย้อนกลับถ้าบันทึกไม่สำเร็จ
      setCur(prev)
      alertError(e instanceof Error ? e.message : 'บันทึกธีมไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const curName = themes.find((t) => t.key === cur)?.name ?? cur

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl grad-bg text-white shadow-glow grid place-items-center text-xl shrink-0">🎨</span>
          <div>
            <h2 className="font-bold text-[16px]">ธีมสีของเว็บไซต์</h2>
            <p className="text-[12px] text-ink-muted mt-0.5">
              คลิกเลือกธีม — ทั้งเว็บและหลังบ้านเปลี่ยนสีทันที (ฟังก์ชันทุกอย่างทำงานเหมือนเดิม)
            </p>
          </div>
        </div>
        <span className="chip chip-primary">ธีมปัจจุบัน: {curName}</span>
      </div>

      <div className="mt-5 grid sm:grid-cols-3 gap-4">
        {themes.map((t) => {
          const on = t.key === cur
          return (
            <button key={t.key} type="button" aria-pressed={on} onClick={() => void choose(t)}
              className={`group relative text-left rounded-[1.6rem] p-3.5 bg-white border-2 transition-all duration-200 hover:-translate-y-1 hover:shadow-lift ${
                on ? 'border-primary shadow-glow' : 'border-[color:var(--border)]'}`}>

              {/* มินิพรีวิวหน้าเว็บ */}
              <div className="relative rounded-[1.15rem] h-28 overflow-hidden" style={{ background: t.bg }} aria-hidden="true">
                <span className="absolute -right-6 -top-8 w-24 h-24 rounded-full opacity-40 blur-xl" style={{ background: t.c2 }} />
                <span className="absolute -left-8 -bottom-10 w-24 h-24 rounded-full opacity-30 blur-xl" style={{ background: t.c1 }} />
                <span className="absolute inset-x-3 top-3 h-5 rounded-full shadow-sm" style={{ background: `linear-gradient(120deg,${t.c1},${t.c2})` }} />
                <span className="absolute left-3 bottom-3 w-[42%] h-11 rounded-xl bg-white shadow-sm" />
                <span className="absolute left-[calc(42%+1.25rem)] bottom-3 h-11 w-11 rounded-xl" style={{ background: t.soft }} />
                <span className="absolute right-3 bottom-4 w-9 h-9 rounded-full shadow-md transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg,${t.c1},${t.c2})` }} />
              </div>

              <div className="mt-3 flex items-center gap-2 min-w-0">
                <span className="font-extrabold text-[14px] truncate">{t.name}</span>
                {on && <span className="chip chip-grad ml-auto shrink-0 !text-[11px] !py-1">✓ ใช้อยู่</span>}
              </div>
              <p className="text-[11.5px] text-ink-muted mt-0.5">{t.desc}</p>

              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full ring-2 ring-white shadow" style={{ background: t.c1 }} />
                <span className="w-4 h-4 rounded-full ring-2 ring-white shadow" style={{ background: t.c2 }} />
                <span className="w-4 h-4 rounded-full ring-2 ring-white shadow" style={{ background: t.soft }} />
                <span className="text-[10.5px] text-ink-faint ml-1 font-medium tracking-wide uppercase">{t.key}</span>
              </div>
            </button>
          )
        })}
      </div>
      <p className="mt-4 text-[11.5px] text-ink-faint">🔒 ธีมนี้ถูกบันทึกในระบบ ผู้เข้าชมทุกคนจะเห็นสีเดียวกับที่คุณเลือก</p>
    </>
  )
}
