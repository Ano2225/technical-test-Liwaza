import { X, Globe, Search, BarChart2, GraduationCap, HeartPulse } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Tool {
  Icon: LucideIcon
  label: string
  description: string
  examples: string[]
}

const TOOLS: Tool[] = [
  {
    Icon: Globe,
    label: 'Profil du pays',
    description: 'Informations générales sur la Côte d\'Ivoire : capitale, région, niveau de revenu, coordonnées géographiques.',
    examples: [
      "Présente la Côte d'Ivoire",
      "Quelle est la capitale du pays ?",
    ],
  },
  {
    Icon: BarChart2,
    label: 'Indicateurs économiques',
    description: 'PIB, PIB par habitant, taux d\'inflation, exportations en % du PIB et autres données macroéconomiques.',
    examples: [
      "Quel est le PIB de la Côte d'Ivoire ?",
      "Évolution du taux d'inflation ces 10 ans",
    ],
  },
  {
    Icon: GraduationCap,
    label: 'Indicateurs éducation',
    description: 'Taux de scolarisation primaire et secondaire, taux d\'alphabétisation des adultes.',
    examples: [
      "Quel est le taux d'alphabétisation ?",
      "Montre la scolarisation primaire depuis 2000",
    ],
  },
  {
    Icon: HeartPulse,
    label: 'Indicateurs santé',
    description: 'Mortalité infantile, espérance de vie à la naissance, incidence du VIH.',
    examples: [
      "Quelle est l'espérance de vie ?",
      "Taux de mortalité infantile ces 5 dernières années",
    ],
  },
  {
    Icon: Search,
    label: 'Recherche d\'indicateurs',
    description: 'Explore la base World Bank pour trouver des indicateurs par mot-clé. Utile pour découvrir ce qui est disponible.',
    examples: [
      "Quels indicateurs existent sur l'emploi ?",
      "Cherche des données sur la pauvreté",
    ],
  },
]

interface Props {
  onClose: () => void
  onSelect: (text: string) => void
}

export default function HelpModal({ onClose, onSelect }: Props) {
  const handleSelect = (text: string) => {
    onClose()
    onSelect(text)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 w-full sm:max-w-lg max-h-[85vh] bg-surface border border-border rounded-t-2xl sm:rounded-2xl flex flex-col animate-fade-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-serif text-base sm:text-lg text-gold">Ce que je sais faire</h2>
            <p className="text-[11px] text-muted mt-0.5">5 outils · données World Bank · Côte d'Ivoire</p>
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
          {TOOLS.map(({ Icon, label, description, examples }) => (
            <div key={label} className="px-5 py-4">
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
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border shrink-0">
          <p className="text-[10px] text-muted text-center">
            Les données proviennent de la{' '}
            <span className="text-gold">Banque Mondiale</span>
            {' '}· api.worldbank.org/v2 · pays CI
          </p>
        </div>
      </div>
    </div>
  )
}
