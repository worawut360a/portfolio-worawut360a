/** แถบหัวหน้าเพจของหลังบ้าน — แปลงจาก admin/_layout.php */
export default function PageHead({
  title, sub, actions,
}: { title: string; sub?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[1.1rem] border border-[color:var(--border)] shadow-sm px-4 md:px-6 py-3.5 flex items-start md:items-center justify-between gap-3 flex-wrap">
      <div className="min-w-0 flex items-center gap-3">
        <span className="w-1.5 h-9 rounded-full bg-primary shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <h1 className="text-[19px] md:text-[22px] font-bold leading-tight truncate">{title}</h1>
          {sub && <p className="text-[12.5px] text-ink-muted mt-0.5">{sub}</p>}
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">{actions}</div>
    </div>
  )
}
