'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * ตัวเลขนับขึ้นเมื่อเลื่อนมาเห็น — ยกมาจาก app.js ของเว็บ PHP (.count-up)
 * ใช้สูตร ease-out เดียวกัน ระยะเวลา 1100 ms เท่ากัน
 */
export default function CountUp({ to, className }: { to: number; className?: string }) {
  const [n, setN] = useState(0)
  const el = useRef<HTMLSpanElement>(null)
  const ran = useRef(false)

  useEffect(() => {
    const node = el.current
    if (!node) return

    const run = () => {
      if (ran.current) return
      ran.current = true
      const dur = 1100
      const t0 = performance.now()
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / dur)
        setN(to * (1 - Math.pow(1 - p, 3)))
        if (p < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }

    if (!('IntersectionObserver' in window)) { run(); return }
    const io = new IntersectionObserver((ents) => {
      for (const e of ents) if (e.isIntersecting) { run(); io.disconnect() }
    }, { threshold: 0.35 })
    io.observe(node)
    return () => io.disconnect()
  }, [to])

  const shown = Number.isInteger(to) ? Math.round(n).toLocaleString('th-TH') : n.toFixed(1)
  return <span ref={el} className={className}>{shown}</span>
}
