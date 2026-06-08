import { useState, useEffect, useCallback } from 'react'
import { ArrowRight, ArrowLeft, MessageSquare, Sparkles, BarChart2, TrendingUp, Heart, BookOpen } from 'lucide-react'
import { useLang } from '@/lib/LanguageContext'
import { translations } from '@/lib/i18n'
import LogoCircle from './ui/LogoCircle'

const TOTAL_STEPS = 3

const STEP2_ICONS = {
  chat: MessageSquare,
  ai:   Sparkles,
  data: BarChart2,
}

const STEP3_ICONS = [TrendingUp, Heart, BookOpen]

interface Props {
  onClose: () => void
  onSelect: (text: string) => void
}

export default function OnboardingModal({ onClose, onSelect }: Props) {
  const [step, setStep] = useState(0)
  const { lang } = useLang()
  const ob = translations[lang].onboarding

  const close = useCallback(() => onClose(), [onClose])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [close])

  const handleSelect = (text: string) => {
    onClose()
    onSelect(text)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 pt-5 pb-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-gold' : i < step ? 'w-1.5 bg-gold/40' : 'w-1.5 bg-border'
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="px-6 pt-4 pb-2 min-h-[280px] flex flex-col">
          <div key={step} className="onboarding-step flex-1 flex flex-col">
            {step === 0 && <StepWelcome title={ob.step1Title} body={ob.step1Body} />}
            {step === 1 && <StepHowItWorks title={ob.step2Title} items={ob.step2Items} />}
            {step === 2 && <StepExplore title={ob.step3Title} body={ob.step3Body} suggestions={ob.step3Suggestions} onSelect={handleSelect} />}
          </div>
        </div>

        {/* Footer nav */}
        <div className="px-6 pb-5 pt-3 flex items-center justify-between border-t border-border/50">
          {step > 0 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1.5 text-xs text-muted hover:text-[#F5F5F5] transition-colors"
            >
              <ArrowLeft size={13} />
              {ob.btnBack}
            </button>
          ) : (
            <button
              onClick={close}
              className="text-xs text-muted hover:text-[#F5F5F5] transition-colors"
            >
              {ob.btnSkip}
            </button>
          )}

          {step < TOTAL_STEPS - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 px-4 py-2 bg-gold text-black text-xs font-semibold rounded-xl hover:bg-gold/90 active:scale-95 transition-all"
            >
              {ob.btnNext}
              <ArrowRight size={13} />
            </button>
          ) : (
            <button
              onClick={close}
              className="flex items-center gap-2 px-4 py-2 bg-gold text-black text-xs font-semibold rounded-xl hover:bg-gold/90 active:scale-95 transition-all"
            >
              {ob.btnStart}
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Step 1 ──────────────────────────────────────────────────────────────────

function StepWelcome({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-5 py-4">
      <LogoCircle size="lg" />
      <div>
        <h2 className="font-serif text-2xl text-gold mb-1">Ivoire Data</h2>
        <p className="text-sm font-medium text-[#F5F5F5]">{title}</p>
      </div>
      <p className="text-xs text-muted leading-relaxed max-w-xs">{body}</p>
      <div className="flex items-center gap-2 text-[10px] text-muted/60 border border-border rounded-pill px-3 py-1">
        <span className="w-1.5 h-1.5 rounded-full bg-green-ci inline-block" />
        World Bank API · Claude Sonnet 4.6
      </div>
    </div>
  )
}

// ── Step 2 ──────────────────────────────────────────────────────────────────

function StepHowItWorks({
  title,
  items,
}: {
  title: string
  items: Array<{ step: 'chat' | 'ai' | 'data'; title: string; body: string }>
}) {
  return (
    <div className="flex flex-col gap-4 py-2">
      <h2 className="text-base font-semibold text-[#F5F5F5]">{title}</h2>
      <div className="flex flex-col gap-3">
        {items.map((item, i) => {
          const Icon = STEP2_ICONS[item.step]
          return (
            <div key={item.step} className="flex items-start gap-3">
              <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-surface2 border border-border">
                <span className="text-[10px] font-bold text-gold">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Icon size={12} className="text-gold shrink-0" strokeWidth={1.75} />
                  <span className="text-xs font-medium text-[#F5F5F5]">{item.title}</span>
                </div>
                <p className="text-[11px] text-muted leading-relaxed">{item.body}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Step 3 ──────────────────────────────────────────────────────────────────

function StepExplore({
  title,
  body,
  suggestions,
  onSelect,
}: {
  title: string
  body: string
  suggestions: string[]
  onSelect: (text: string) => void
}) {
  return (
    <div className="flex flex-col gap-4 py-2">
      <div>
        <h2 className="text-base font-semibold text-[#F5F5F5] mb-1">{title}</h2>
        <p className="text-xs text-muted">{body}</p>
      </div>
      <div className="flex flex-col gap-2">
        {suggestions.map((text, i) => {
          const Icon = STEP3_ICONS[i % STEP3_ICONS.length]
          return (
            <button
              key={text}
              onClick={() => onSelect(text)}
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-surface2 border border-border text-left text-xs text-[#F5F5F5] hover:border-gold/40 hover:bg-surface2/80 active:scale-[0.98] transition-all group"
            >
              <Icon size={13} className="shrink-0 text-muted group-hover:text-gold transition-colors" strokeWidth={1.75} />
              <span className="group-hover:text-gold transition-colors">{text}</span>
              <ArrowRight size={11} className="ml-auto shrink-0 text-muted group-hover:text-gold transition-colors" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
