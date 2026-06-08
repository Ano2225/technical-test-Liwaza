import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowUp, AlertCircle, TrendingUp, BookOpen, Heart, BarChart2, Globe, type LucideIcon } from 'lucide-react'
import { sendMessage, makeUserMessage } from '@/lib/api'
import type { ChatMessage } from '@/lib/api'
import ChatBubble from './ChatBubble'

// ── Suggestions ───────────────────────────────────────────────────────────────

const SUGGESTIONS: { Icon: LucideIcon; text: string }[] = [
  { Icon: TrendingUp, text: "Quel est le PIB de la Côte d'Ivoire ?" },
  { Icon: BookOpen,   text: "Montre-moi le taux d'alphabétisation" },
  { Icon: Heart,      text: "Quelle est l'espérance de vie ?" },
  { Icon: BarChart2,  text: 'Taux d\'inflation ces 5 dernières années' },
]

// ── Shared ────────────────────────────────────────────────────────────────────

function LogoCircle({ size }: { size: 'sm' | 'lg' }) {
  const dim = size === 'sm' ? 'w-8 h-8' : 'w-16 h-16'
  const iconSize = size === 'sm' ? 15 : 28
  return (
    <div
      className={`${dim} rounded-full shrink-0 flex items-center justify-center`}
      style={{ background: 'linear-gradient(135deg, #F4A201 0%, #009A44 100%)' }}
    >
      <Globe size={iconSize} color="#0A0A0A" strokeWidth={1.75} />
    </div>
  )
}

// ── Loading bubble ────────────────────────────────────────────────────────────

function LoadingBubble() {
  return (
    <div className="flex flex-col items-start animate-fade-up">
      <div className="px-4 py-3.5 rounded-[18px] rounded-tl-sm bg-surface2">
        <div className="flex items-center gap-1.5 h-4">
          <span className="w-1.5 h-1.5 rounded-full bg-muted dot-1" />
          <span className="w-1.5 h-1.5 rounded-full bg-muted dot-2" />
          <span className="w-1.5 h-1.5 rounded-full bg-muted dot-3" />
        </div>
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onSelect }: { onSelect: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-4 py-16 text-center">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3">
        <LogoCircle size="lg" />
        <div>
          <h1 className="font-serif text-3xl text-gold">Ivoire Data</h1>
          <p className="text-muted text-sm mt-1 max-w-xs">
            Explorez les données publiques de la Côte d&apos;Ivoire grâce à l&apos;intelligence artificielle
          </p>
        </div>
      </div>

      {/* Suggestions grid */}
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

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSubmit = useCallback(async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || loading) return

    const userMsg = makeUserMessage(content)
    const historySnapshot = messages // snapshot before state update

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setError(null)
    setLoading(true)

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const reply = await sendMessage(content, historySnapshot)
      setMessages((prev) => [...prev, reply])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(`Une erreur est survenue : ${msg}`)
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSubmit()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    // Auto-resize
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
  }

  const handleSuggestion = (text: string) => {
    void handleSubmit(text)
  }

  return (
    <div className="flex flex-col h-screen bg-bg">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-5 h-14 border-b border-border shrink-0 backdrop-blur-sm bg-bg/80 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <LogoCircle size="sm" />
          <div className="leading-tight">
            <span className="font-serif text-lg text-gold">Ivoire Data</span>
            <p className="text-[10px] text-muted hidden sm:block">Assistant IA pour les données publiques</p>
          </div>
        </div>
        <span className="px-2.5 py-1 text-[10px] font-medium text-green-ci bg-green-dim border border-green-border rounded-pill">
          IA · World Bank
        </span>
      </header>

      {/* ── Messages ── */}
      <main className="flex-1 overflow-y-auto">
        {messages.length === 0 && !loading ? (
          <EmptyState onSelect={handleSuggestion} />
        ) : (
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            {loading && <LoadingBubble />}
            {error && (
              <div className="flex items-start gap-2 px-4 py-3 rounded-card bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-up">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* ── Input ── */}
      <div className="shrink-0 border-t border-border px-4 py-3 bg-bg">
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Posez votre question sur la Côte d'Ivoire…"
            rows={1}
            disabled={loading}
            className="flex-1 min-h-[44px] max-h-40 bg-surface border border-border rounded-xl px-4 py-3 text-sm text-[#F5F5F5] placeholder:text-muted resize-none focus:outline-none focus:border-gold/50 disabled:opacity-50 transition-colors duration-200"
          />
          <button
            onClick={() => void handleSubmit()}
            disabled={!input.trim() || loading}
            aria-label="Envoyer"
            className="shrink-0 w-11 h-11 flex items-center justify-center rounded-xl bg-gold text-black hover:bg-gold/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
          >
            <ArrowUp size={18} strokeWidth={2.5} />
          </button>
        </div>
        <p className="max-w-2xl mx-auto text-[10px] text-muted mt-2 text-center">
          Entrée pour envoyer · Maj+Entrée pour un saut de ligne
        </p>
      </div>
    </div>
  )
}
