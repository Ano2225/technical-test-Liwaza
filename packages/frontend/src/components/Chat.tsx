import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowUp, SquarePen, HelpCircle } from 'lucide-react'
import { sendMessage, makeUserMessage, makeErrorMessage } from '@/lib/api'
import type { ChatMessage } from '@/lib/api'
import ChatBubble from './ChatBubble'
import LoadingBubble from './ui/LoadingBubble'
import EmptyState from './EmptyState'
import HelpModal from './HelpModal'
import LogoCircle from './ui/LogoCircle'

const LOADING_STATUSES = [
  'Analyse en cours…',
  'Consultation des données…',
  'World Bank API…',
  'Préparation de la réponse…',
]

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState(LOADING_STATUSES[0])
  const [helpOpen, setHelpOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus input on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Cycle status messages while loading
  useEffect(() => {
    if (!loading) {
      setLoadingStatus(LOADING_STATUSES[0])
      return
    }
    let i = 0
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_STATUSES.length
      setLoadingStatus(LOADING_STATUSES[i])
    }, 2500)
    return () => clearInterval(interval)
  }, [loading])

  const handleSubmit = useCallback(async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || loading) return

    const userMsg = makeUserMessage(content)
    const historySnapshot = messages

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const reply = await sendMessage(content, historySnapshot)
      setMessages((prev) => [...prev, reply])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      setMessages((prev) => [...prev, makeErrorMessage(`Une erreur est survenue : ${msg}`)])
    } finally {
      setLoading(false)
      setTimeout(() => textareaRef.current?.focus(), 50)
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
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
  }

  const handleNewConversation = () => {
    setMessages([])
    setInput('')
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  const exchangeCount = messages.filter((m) => m.role === 'user').length

  return (
    <>
    {helpOpen && (
      <HelpModal
        onClose={() => setHelpOpen(false)}
        onSelect={(text) => void handleSubmit(text)}
      />
    )}
    <div className="flex flex-col h-screen bg-bg">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-5 h-14 border-b border-border shrink-0 backdrop-blur-sm bg-bg/80 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <LogoCircle size="sm" />
          <div className="leading-tight">
            <span className="font-serif text-base sm:text-lg text-gold">Ivoire Data</span>
            <p className="text-[10px] text-muted hidden sm:block">Assistant IA · données publiques</p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {exchangeCount > 0 && (
            <span className="hidden sm:inline text-[10px] text-muted px-2 py-0.5 rounded-pill border border-border">
              {exchangeCount} {exchangeCount === 1 ? 'échange' : 'échanges'}
            </span>
          )}
          <span className="hidden sm:inline-flex px-2.5 py-1 text-[10px] font-medium text-green-ci bg-green-dim border border-green-border rounded-pill">
            IA · World Bank
          </span>
          <button
            onClick={() => setHelpOpen(true)}
            title="Aide — ce que je sais faire"
            aria-label="Aide"
            className="p-2 rounded-lg text-muted hover:text-[#F5F5F5] hover:bg-surface2 transition-colors"
          >
            <HelpCircle size={15} />
          </button>
          {messages.length > 0 && (
            <button
              onClick={handleNewConversation}
              title="Nouvelle conversation"
              aria-label="Nouvelle conversation"
              className="p-2 rounded-lg text-muted hover:text-[#F5F5F5] hover:bg-surface2 transition-colors"
            >
              <SquarePen size={15} />
            </button>
          )}
        </div>
      </header>

      {/* ── Messages ── */}
      <main className="flex-1 overflow-y-auto">
        {messages.length === 0 && !loading ? (
          <EmptyState onSelect={(text) => void handleSubmit(text)} />
        ) : (
          <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-5">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            {loading && <LoadingBubble status={loadingStatus} />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* ── Input ── */}
      <div className="shrink-0 border-t border-border px-3 sm:px-4 py-2 sm:py-3 bg-bg">
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Posez votre question sur la Côte d'Ivoire…"
            rows={1}
            disabled={loading}
            className="flex-1 min-h-[40px] sm:min-h-[44px] max-h-40 bg-surface border border-border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-[#F5F5F5] placeholder:text-muted resize-none focus:outline-none focus:border-gold/50 disabled:opacity-50 transition-colors duration-200"
          />
          <button
            onClick={() => void handleSubmit()}
            disabled={!input.trim() || loading}
            aria-label="Envoyer"
            className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl bg-gold text-black hover:bg-gold/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
          >
            <ArrowUp size={18} strokeWidth={2.5} />
          </button>
        </div>
        <p className="max-w-2xl mx-auto text-[10px] text-muted mt-2 text-center">
          Entrée pour envoyer · Maj+Entrée pour un saut de ligne
          {exchangeCount > 0 && (
            <> · <span className="text-muted/70">{exchangeCount * 2} messages en contexte</span></>
          )}
        </p>
      </div>
    </div>
    </>
  )
}
