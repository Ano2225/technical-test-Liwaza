import { useState } from 'react'
import { Globe, Search, BarChart2, GraduationCap, HeartPulse, Settings, ChevronDown, ChevronUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ToolCallRecord } from '@/lib/api'

interface Props {
  call: ToolCallRecord
}

const TOOL_META: Record<string, { Icon: LucideIcon; label: string; description: string }> = {
  get_country_profile:      { Icon: Globe,         label: 'Profil du pays',             description: 'Informations générales sur la Côte d\'Ivoire' },
  search_indicators:        { Icon: Search,        label: 'Recherche indicateurs',      description: 'Recherche dans la base World Bank' },
  get_economic_indicators:  { Icon: BarChart2,     label: 'Indicateurs économiques',    description: 'PIB, inflation, commerce, budget' },
  get_education_indicators: { Icon: GraduationCap, label: 'Indicateurs éducation',      description: 'Scolarisation, alphabétisation' },
  get_health_indicators:    { Icon: HeartPulse,    label: 'Indicateurs santé',          description: 'Mortalité, espérance de vie, maladies' },
}

const PARAM_LABELS: Record<string, string> = {
  indicator_id: 'Indicateur',
  country_code: 'Pays',
  keyword:      'Recherche',
  per_page:     'Résultats',
  page:         'Page',
}

export default function ToolCallBadge({ call }: Props) {
  const [open, setOpen] = useState(false)
  const meta = TOOL_META[call.tool] ?? { Icon: Settings, label: call.tool, description: '' }
  const { Icon, label } = meta
  const hasError = call.result && 'error' in call.result

  const inputEntries = Object.entries(call.input).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  )

  return (
    <div className="text-xs font-medium">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill border transition-all duration-150 ${
          hasError
            ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/15'
            : 'bg-green-dim text-green-ci border-green-border hover:bg-green-ci/10'
        }`}
      >
        <Icon size={11} strokeWidth={2} />
        <span>{label}</span>
        {open
          ? <ChevronUp size={10} className="opacity-60" />
          : <ChevronDown size={10} className="opacity-60" />}
      </button>

      {open && (
        <div className="mt-2 ml-0.5 pl-3 border-l border-border space-y-3 animate-fade-up">
          {inputEntries.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted mb-1.5 font-medium">
                Paramètres
              </p>
              <div className="space-y-1">
                {inputEntries.map(([k, v]) => (
                  <div key={k} className="flex items-baseline gap-2">
                    <span className="text-muted shrink-0 w-20">
                      {PARAM_LABELS[k] ?? k}
                    </span>
                    <code className="text-gold font-mono text-[11px] break-all">{String(v)}</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasError && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted mb-1.5 font-medium">
                Erreur
              </p>
              <code className="text-red-400 font-mono text-[11px]">
                {(call.result as { error: string }).error}
              </code>
            </div>
          )}

          {!hasError && !inputEntries.length && (
            <p className="text-muted text-[11px]">Aucun paramètre</p>
          )}
        </div>
      )}
    </div>
  )
}
