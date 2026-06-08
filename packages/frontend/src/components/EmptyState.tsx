import { TrendingUp, BookOpen, Heart, BarChart2, type LucideIcon } from 'lucide-react'
import LogoCircle from './ui/LogoCircle'
import { useLang } from '@/lib/LanguageContext'
import { translations } from '@/lib/i18n'

const ICONS: LucideIcon[] = [TrendingUp, BookOpen, Heart, BarChart2]

interface Props {
  onSelect: (text: string) => void
}

export default function EmptyState({ onSelect }: Props) {
  const { lang } = useLang()
  const tr = translations[lang]

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 sm:gap-8 px-4 py-10 sm:py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <LogoCircle size="lg" />
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-gold">Ivoire Data</h1>
          <p className="text-muted text-xs sm:text-sm mt-1 max-w-xs">
            {tr.emptySubtitle}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full max-w-lg">
        {tr.suggestions.map((text, i) => {
          const Icon = ICONS[i % ICONS.length]
          return (
            <button
              key={text}
              onClick={() => onSelect(text)}
              className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-card bg-surface border border-border text-left text-xs sm:text-sm text-[#F5F5F5] hover:border-gold/40 hover:bg-surface2 transition-all duration-200 group"
            >
              <Icon size={14} className="shrink-0 mt-0.5 text-muted group-hover:text-gold transition-colors" strokeWidth={1.75} />
              <span className="leading-snug group-hover:text-gold transition-colors">{text}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
