import { TrendingUp, TrendingDown, Minus, Globe, Search } from 'lucide-react'
import type { ToolData, TimeSeriesData, CountryProfileData, SearchResultData } from '@/lib/api'
import { formatValue, calcTrend } from '@/lib/formatters'
import { useLang } from '@/lib/LanguageContext'
import { translations } from '@/lib/i18n'
import DataCard from './ui/DataCard'
import Sparkline from './ui/Sparkline'

interface Props {
  data: ToolData
  toolName?: string
}

function TimeSeriesCard({ data }: { data: TimeSeriesData }) {
  const { lang } = useLang()
  const tr = translations[lang]
  const latest = data.data.find((d) => d.value !== null)
  if (!latest) return null

  const trend = calcTrend(data.data)
  const TrendIcon  = trend?.dir === 'up' ? TrendingUp : trend?.dir === 'down' ? TrendingDown : Minus
  const trendColor = trend?.dir === 'up' ? 'text-green-ci' : trend?.dir === 'down' ? 'text-red-400' : 'text-muted'

  return (
    <DataCard>
      <p className="text-muted text-xs mb-1">{data.indicator.country}</p>
      <p className="font-medium text-[#F5F5F5] leading-snug">{data.indicator.name}</p>

      <div className="flex items-end justify-between mt-3">
        <div>
          <p className="text-lg sm:text-2xl font-semibold text-[#F5F5F5]">
            {formatValue(latest.value as number, data.indicator.name, lang)}
          </p>
          <p className="text-xs text-muted mt-0.5">{tr.dataYear(latest.year)}</p>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 ${trendColor} text-xs font-medium`}>
            <TrendIcon size={14} />
            <span>{trend.pct > 0 ? '+' : ''}{trend.pct.toFixed(1)} %</span>
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
  const { lang } = useLang()
  const { countryLabels } = translations[lang]

  const rows = [
    { label: countryLabels.capital, value: data.capital_city },
    { label: countryLabels.region,  value: data.region },
    { label: countryLabels.income,  value: data.income_level },
    { label: countryLabels.iso,     value: data.id },
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
  const { lang } = useLang()
  const tr = translations[lang]

  return (
    <DataCard>
      <p className="text-muted text-xs mb-2 flex items-center gap-1.5">
        <Search size={11} />
        {tr.indicatorsFound(data.total)}
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
  if (isTimeSeries(data))    return <TimeSeriesCard data={data} />
  if (isCountryProfile(data)) return <CountryCard data={data} />
  if (isSearchResult(data))  return <SearchCard data={data} />
  return null
}
