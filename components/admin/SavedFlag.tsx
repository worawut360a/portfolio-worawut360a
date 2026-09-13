export default function SavedFlag({ show }: { show: boolean }) {
  if (!show) return null
  return <span className="chip !text-[12px]" style={{ background: '#E8F6EE', color: '#2E7D4F', borderColor: '#B6E3C8' }}>✓ บันทึกแล้ว</span>
}
