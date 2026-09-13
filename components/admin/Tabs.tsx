'use client'

import { useState } from 'react'

/** แท็บสลับแผง — ใช้คลาส .filter-pill ชุดเดียวกับเว็บ PHP */
export default function Tabs({
  tabs, panels, initial = 0,
}: { tabs: string[]; panels: React.ReactNode[]; initial?: number }) {
  const [i, setI] = useState(initial)
  return (
    <>
      <div role="tablist" className="mt-4 flex gap-2 overflow-x-auto scroll-x pb-1">
        {tabs.map((label, k) => (
          <button key={label} type="button" role="tab" aria-selected={k === i}
            onClick={() => setI(k)}
            className={`filter-pill${k === i ? ' active' : ''}`}>{label}</button>
        ))}
      </div>
      {panels.map((panel, k) => (
        <div key={k} className={`mt-4${k === i ? '' : ' hidden'}`}>{panel}</div>
      ))}
    </>
  )
}
