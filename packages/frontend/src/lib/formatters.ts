export function formatValue(value: number, indicatorName: string): string {
  const name = indicatorName.toLowerCase()
  const isPercent =
    name.includes('%') ||
    name.includes('rate') ||
    name.includes('enrollment') ||
    name.includes('literacy') ||
    name.includes('incidence') ||
    name.includes('inflation')
  const isYears = name.includes('life expectancy') || name.includes('years')

  if (isPercent) return `${value.toFixed(1)} %`
  if (isYears) return `${value.toFixed(1)} ans`
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)} T USD`
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} Mrd USD`
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)} M USD`
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value)
}

export function calcTrend(
  data: Array<{ value: number | null }>,
): { pct: number; dir: 'up' | 'down' | 'flat' } | null {
  const valid = data.filter((d) => d.value !== null).map((d) => d.value as number)
  if (valid.length < 2) return null
  const latest = valid[0]
  const prev = valid[1]
  if (prev === 0) return null
  const pct = ((latest - prev) / Math.abs(prev)) * 100
  return { pct, dir: pct > 0.5 ? 'up' : pct < -0.5 ? 'down' : 'flat' }
}
