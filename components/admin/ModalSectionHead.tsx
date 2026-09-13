/** หัวข้อคั่นในโมดัล — ไอคอนสี + ชื่อหัวข้อ + เส้นคั่นยาวจนสุดขอบ (ยกมาจากโมดัลของเว็บ PHP) */
export default function ModalSectionHead({
  icon, bg, extra, children,
}: { icon: string; bg: string; extra?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <span className={`w-9 h-9 rounded-xl grid place-items-center text-base ${bg} shrink-0`}>{icon}</span>
      <h4 className="font-bold text-[14px]">
        {children}{extra && <span className="text-[11.5px] font-normal text-ink-muted"> {extra}</span>}
      </h4>
      <span className="flex-1 h-px bg-[color:var(--divider)]" />
    </div>
  )
}
