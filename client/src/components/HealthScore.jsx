export default function HealthScore({ score, indicator }) {
  const color =
    indicator === 'green'
      ? 'text-green-500'
      : indicator === 'yellow'
      ? 'text-yellow-500'
      : 'text-red-500'

  const ring =
    indicator === 'green'
      ? 'border-green-400'
      : indicator === 'yellow'
      ? 'border-yellow-400'
      : 'border-red-400'

  return (
    <div className={`w-28 h-28 rounded-full border-8 ${ring} flex flex-col items-center justify-center`}>
      <span className={`text-3xl font-bold ${color}`}>{score}</span>
      <span className="text-xs text-gray-400 mt-1">Health</span>
    </div>
  )
}