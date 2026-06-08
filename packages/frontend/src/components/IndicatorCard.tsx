import type { ToolData, TimeSeriesData, CountryProfileData, SearchResultData } from '@/lib/api'
import { TrendingUp, TrendingDown, Minus, Globe, Search } from 'lucide-react'

interface Props {
  data: ToolData
  toolName?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatValue(value: number, indicatorName: string): string {
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

function calcTrend(data: Array<{ value: number | null }>): { pct: number; dir: 'up' | 'down' | 'flat' } | null {
  const valid = data.filter((d) => d.value !== null).map((d) => d.value as number)
  if (valid.length < 2) return null
  const latest = valid[0]
  const prev = valid[1]
  if (prev === 0) return null
  const pct = ((latest - prev) / Math.abs(prev)) * 100
  return { pct, dir: pct > 0.5 ? 'up' : pct < -0.5 ? 'down' : 'flat' }
}

// ── Mini sparkline ────────────────────────────────────────────────────────────

function Sparkline({ dataPoints }: { dataPoints: Array<{ value: number | null }> }) {
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

// ── Shared card shell ─────────────────────────────────────────────────────────

function DataCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-card border-l-2 border-gold bg-surface2 p-4 text-sm animate-fade-up">
      {children}
    </div>
  )
}

// ── Sub-cards ─────────────────────────────────────────────────────────────────

function TimeSeriesCard({ data }: { data: TimeSeriesData }) {
  const latest = data.data.find((d) => d.value !== null)
  if (!latest) return null

  const trend = calcTrend(data.data)
  const TrendIcon = trend?.dir === 'up' ? TrendingUp : trend?.dir === 'down' ? TrendingDown : Minus
  const trendColor = trend?.dir === 'up' ? 'text-green-ci' : trend?.dir === 'down' ? 'text-red-400' : 'text-muted'

  return (
    <DataCard>
      <p className="text-muted text-xs mb-1">{data.indicator.country}</p>
      <p className="font-medium text-[#F5F5F5] leading-snug">{data.indicator.name}</p>

      <div className="flex items-end justify-between mt-3">
        <div>
          <p className="text-2xl font-semibold text-[#F5F5F5]">
            {formatValue(latest.value as number, data.indicator.name)}
          </p>
          <p className="text-xs text-muted mt-0.5">Données {latest.year}</p>
        </div>

        {trend && (
          <div className={`flex items-center gap-1 ${trendColor} text-xs font-medium`}>
            <TrendIcon size={14} />
            <span>
              {trend.pct > 0 ? '+' : ''}
              {trend.pct.toFixed(1)} %
            </span>
          </div>
        )}
      </div>

      {data.data.length > 2 && (
        <div className="mt-3 opacity-80">
          <Sparkline dataPoints={data.data} />
        </div>
      )}
    </DataCard>
  )
}

function CountryCard({ data }: { data: CountryProfileData }) {
  const rows = [
    { label: 'Capitale', value: data.capital_city },
    { label: 'Région', value: data.region },
    { label: "Niveau de revenu", value: data.income_level },
    { label: 'Code ISO', value: data.id },
  ]
  return (
    <DataCard>
      <p className="font-semibold text-[#F5F5F5] text-base mb-3 flex items-center gap-2">
        <Globe size={15} className="text-gold shrink-0" />
        {data.name}
      </p>
      <div className="space-y-1.5">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between gap-4">
            <span className="text-muted">{label}</span>
            <span className="text-[#F5F5F5] text-right">{value}</span>
          </div>
        ))}
      </div>
    </DataCard>
  )
}

function SearchCard({ data }: { data: SearchResultData }) {
  return (
    <DataCard>
      <p className="text-muted text-xs mb-2 flex items-center gap-1.5">
        <Search size={11} />
        {new Intl.NumberFormat('fr-FR').format(data.total)} indicateurs trouvés
      </p>
      <div className="space-y-2">
        {data.indicators.slice(0, 5).map((ind) => (
          <div key={ind.id} className="flex gap-3">
            <code className="text-gold text-xs shrink-0 mt-0.5">{ind.id}</code>
            <span className="text-[#F5F5F5] text-xs leading-snug">{ind.name}</span>
          </div>
        ))}
      </div>
    </DataCard>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

function isTimeSeries(d: ToolData): d is TimeSeriesData {
  return 'indicator' in d && 'data' in d && Array.isArray((d as TimeSeriesData).data)
}

function isCountryProfile(d: ToolData): d is CountryProfileData {
  return 'capital_city' in d
}

function isSearchResult(d: ToolData): d is SearchResultData {
  return 'indicators' in d && Array.isArray((d as SearchResultData).indicators)
}

export default function IndicatorCard({ data }: Props) {
  if (!data || 'error' in data) return null
  if (isTimeSeries(data)) return <TimeSeriesCard data={data} />
  if (isCountryProfile(data)) return <CountryCard data={data} />
  if (isSearchResult(data)) return <SearchCard data={data} />
  return null
}
