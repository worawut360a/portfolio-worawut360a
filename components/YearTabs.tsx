import Link from 'next/link'

/** ตัวเลือกปี — เป็นลิงก์ล้วน ทำงานได้แม้ปิด JavaScript และ Google เก็บ index ได้ */
export default function YearTabs({
  years, current, hrefFor,
}: { years: number[]; current: number; hrefFor: (y: number) => string }) {
  if (years.length <= 1) return null
  return (
    <div className="flex gap-2 flex-nowrap md:flex-wrap scroll-x pb-1">
      {years.map((y) => {
        const on = y === current
        return (
          <Link
            key={y}
            href={hrefFor(y)}
            className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-bold border transition ${
              on ? 'text-white border-transparent' : 'bg-white text-ink-soft border-[color:var(--border)] hover:border-[color:var(--primary-line)]'
            }`}
            style={on ? { background: 'var(--grad)' } : undefined}
          >
            {y}
          </Link>
        )
      })}
    </div>
  )
}
