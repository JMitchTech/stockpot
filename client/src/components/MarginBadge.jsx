export default function MarginBadge({ pct }) {
  if (pct === null || pct === undefined) return null

  const color =
    pct >= 70
      ? 'bg-green-100 text-green-800'
      : pct >= 50
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-red-100 text-red-800'

  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${color}`}>
      {pct}%
    </span>
  )
}