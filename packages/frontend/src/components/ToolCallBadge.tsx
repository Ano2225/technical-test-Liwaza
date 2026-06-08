import { Globe, Search, BarChart2, GraduationCap, HeartPulse, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  toolName: string
}

const TOOL_META: Record<string, { Icon: LucideIcon; label: string }> = {
  get_country_profile:      { Icon: Globe,         label: 'Profil du pays' },
  search_indicators:        { Icon: Search,        label: 'Recherche indicateurs' },
  get_economic_indicators:  { Icon: BarChart2,     label: 'Indicateurs économiques' },
  get_education_indicators: { Icon: GraduationCap, label: 'Indicateurs éducation' },
  get_health_indicators:    { Icon: HeartPulse,    label: 'Indicateurs santé' },
}

export default function ToolCallBadge({ toolName }: Props) {
  const meta = TOOL_META[toolName] ?? { Icon: Settings, label: toolName }
  const { Icon, label } = meta
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-medium bg-green-dim text-green-ci border border-green-border mb-2">
      <Icon size={12} strokeWidth={2} />
      <span>{label}</span>
    </span>
  )
}
