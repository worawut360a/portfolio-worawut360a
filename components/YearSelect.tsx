'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

export interface YearOption { year: number; meta: string; url: string; active: boolean }

/**
 * dropdown เลือกปีงบประมาณ — ยกมาจาก partials/year-select.php ของเว็บ PHP
 * ใช้คลาส .ysel* ชุดเดียวกัน หน้าตาจึงเหมือนกันเป๊ะ
 *
 * เมนูวางด้วย position:absolute → section ที่ครอบต้องไม่มี overflow-hidden
 */
export default function YearSelect({
  items, label = 'ปีงบประมาณ:', head = 'เลือกปีงบประมาณ', note = '', tone = 'dark',
}: {
  items: YearOption[]
  label?: string; head?: string; note?: string; tone?: 'dark' | 'light'
}) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const away = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', away)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', away)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  if (items.length === 0) return null
  const cur = items.find((i) => i.active) ?? items[0]!
  const only = items.length === 1
  const labelCls = tone === 'light' ? 'text-ink-soft' : 'text-white/80'
  const noteCls = tone === 'light' ? 'text-ink-muted' : 'text-white/55'

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {label && <span className={`text-[13px] font-bold ${labelCls} shrink-0`}>{label}</span>}

      {only ? (
        <span className="ysel-btn !cursor-default !shadow-none">
          📅 {cur.year}
          {cur.meta && <span className="ysel-meta">{cur.meta}</span>}
        </span>
      ) : (
        <div className="ysel" ref={box}>
          <button type="button" className="ysel-btn" aria-haspopup="listbox" aria-expanded={open}
            onClick={() => setOpen((v) => !v)}>
            <span>📅 {cur.year}</span>
            {cur.meta && <span className="ysel-meta">{cur.meta}</span>}
            <span className="ysel-cav" aria-hidden="true">▼</span>
          </button>

          <div className={`ysel-menu${open ? ' open' : ''}`} role="listbox" aria-label={head}>
            <p className="ysel-head">{head} · {items.length} ปี</p>
            {items.map((it) => (
              <Link key={it.year} href={it.url} role="option" aria-selected={it.active}
                onClick={() => setOpen(false)}
                className={`ysel-item${it.active ? ' is-active' : ''}`}>
                <span className="ysel-y">{it.year}</span>
                <span className="ysel-sub">{it.meta}</span>
                {it.active && <span className="ysel-tick" aria-hidden="true">✓</span>}
              </Link>
            ))}
          </div>
        </div>
      )}

      {note && <span className={`text-[12px] ${noteCls} shrink-0`}>{note}</span>}
    </div>
  )
}
