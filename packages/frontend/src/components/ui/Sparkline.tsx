interface Props {
  dataPoints: Array<{ value: number | null }>
}

export default function Sparkline({ dataPoints }: Props) {
  const valid = [...dataPoints].reverse().filter((d) => d.value !== null) as Array<{ value: number }>
  if (valid.length < 3) return null

  const values = valid.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const W = 100
  const H = 28

  const pts = valid
    .map((d, i) => {
      const x = (i / (valid.length - 1)) * W
      const y = H - ((d.value - min) / range) * (H - 4) - 2
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={100} height={28} className="overflow-visible">
      <polyline points={pts} fill="none" stroke="#F4A201" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
