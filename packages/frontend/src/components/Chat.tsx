import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowUp, AlertCircle } from 'lucide-react'
import { sendMessage, makeUserMessage } from '@/lib/api'
import type { ChatMessage } from '@/lib/api'
import ChatBubble from './ChatBubble'
import LoadingBubble from './LoadingBubble'
import EmptyState from './EmptyState'
import LogoCircle from './LogoCircle'

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSubmit = useCallback(async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || loading) return

    const userMsg = makeUserMessage(content)
    const historySnapshot = messages

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setError(null)
    setLoading(true)

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
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
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
          <EmptyState onSelect={(text) => void handleSubmit(text)} />
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
