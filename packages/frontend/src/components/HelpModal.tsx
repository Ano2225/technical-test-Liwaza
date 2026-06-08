import { X, Globe, Search, BarChart2, GraduationCap, HeartPulse } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useLang } from '@/lib/LanguageContext'
import { translations } from '@/lib/i18n'

const TOOL_ICONS: Record<string, LucideIcon> = {
  get_country_profile:      Globe,
  search_indicators:        Search,
  get_economic_indicators:  BarChart2,
  get_education_indicators: GraduationCap,
  get_health_indicators:    HeartPulse,
}

interface Props {
  onClose: () => void
  onSelect: (text: string) => void
}

export default function HelpModal({ onClose, onSelect }: Props) {
  const { lang } = useLang()
  const tr = translations[lang]

  const handleSelect = (text: string) => {
    onClose()
    onSelect(text)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative z-10 w-full sm:max-w-lg max-h-[85vh] bg-surface border border-border rounded-t-2xl sm:rounded-2xl flex flex-col animate-fade-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-serif text-base sm:text-lg text-gold">{tr.helpModalTitle}</h2>
            <p className="text-[11px] text-muted mt-0.5">{tr.helpModalSubtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-[#F5F5F5] hover:bg-surface2 transition-colors"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tool list */}
        <div className="overflow-y-auto flex-1 divide-y divide-border">
          {tr.helpTools.map(({ key, label, description, examples }) => {
            const Icon = TOOL_ICONS[key] ?? Globe
            return (
              <div key={key} className="px-5 py-4">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-green-dim border border-green-border flex items-center justify-center shrink-0">
                    <Icon size={13} className="text-green-ci" strokeWidth={2} />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-[#F5F5F5]">{label}</span>
                </div>
                <p className="text-[11px] sm:text-xs text-muted leading-relaxed mb-3 pl-[34px]">
                  {description}
                </p>
                <div className="flex flex-col gap-1.5 pl-[34px]">
                  {examples.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => handleSelect(ex)}
                      className="text-left text-[11px] sm:text-xs text-muted hover:text-gold border border-border hover:border-gold/40 rounded-lg px-3 py-2 bg-surface2 hover:bg-surface transition-all duration-150"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border shrink-0">
          <p className="text-[10px] text-muted text-center">
            {tr.helpModalFooter.split('Banque Mondiale').length > 1 ? (
              <>
                {tr.helpModalFooter.split('Banque Mondiale')[0]}
                <span className="text-gold">Banque Mondiale</span>
                {tr.helpModalFooter.split('Banque Mondiale')[1]}
              </>
            ) : tr.helpModalFooter.split('World Bank').length > 1 ? (
              <>
                {tr.helpModalFooter.split('World Bank')[0]}
                <span className="text-gold">World Bank</span>
                {tr.helpModalFooter.split('World Bank')[1]}
              </>
            ) : (
              tr.helpModalFooter
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
