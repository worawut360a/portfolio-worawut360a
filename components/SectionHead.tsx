export default function SectionHead({
  chip, title, accent, right,
}: { chip?: string; title: string; accent?: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
      <div>
        {chip && <span className="chip">{chip}</span>}
        <h2 className="mt-2.5 text-[24px] md:text-[32px] font-extrabold leading-tight">
          {title}{accent && <span className="grad-text"> {accent}</span>}
        </h2>
      </div>
      {right}
    </div>
  )
}
