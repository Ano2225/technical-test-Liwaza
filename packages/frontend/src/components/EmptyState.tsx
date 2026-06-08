import { TrendingUp, BookOpen, Heart, BarChart2, type LucideIcon } from 'lucide-react'
import LogoCircle from './ui/LogoCircle'

const SUGGESTIONS: { Icon: LucideIcon; text: string }[] = [
  { Icon: TrendingUp, text: "Quel est le PIB de la Côte d'Ivoire ?" },
  { Icon: BookOpen,   text: "Montre-moi le taux d'alphabétisation" },
  { Icon: Heart,      text: "Quelle est l'espérance de vie ?" },
  { Icon: BarChart2,  text: "Taux d'inflation ces 5 dernières années" },
]

interface Props {
  onSelect: (text: string) => void
}

export default function EmptyState({ onSelect }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-4 py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <LogoCircle size="lg" />
        <div>
          <h1 className="font-serif text-3xl text-gold">Ivoire Data</h1>
          <p className="text-muted text-sm mt-1 max-w-xs">
            Explorez les données publiques de la Côte d&apos;Ivoire grâce à l&apos;intelligence artificielle
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {SUGGESTIONS.map(({ Icon, text }) => (
          <button
            key={text}
            onClick={() => onSelect(text)}
            className="flex items-start gap-3 p-4 rounded-card bg-surface border border-border text-left text-sm text-[#F5F5F5] hover:border-gold/40 hover:bg-surface2 transition-all duration-200 group"
          >
            <Icon size={16} className="shrink-0 mt-0.5 text-muted group-hover:text-gold transition-colors" strokeWidth={1.75} />
            <span className="leading-snug group-hover:text-gold transition-colors">{text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
