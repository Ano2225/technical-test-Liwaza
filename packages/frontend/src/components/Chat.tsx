import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowUp, SquarePen, HelpCircle, Languages } from 'lucide-react'
import { sendMessage, makeUserMessage, makeErrorMessage } from '@/lib/api'
import type { ChatMessage } from '@/lib/api'
import { useLang } from '@/lib/LanguageContext'
import { translations } from '@/lib/i18n'
import ChatBubble from './ChatBubble'
import LoadingBubble from './ui/LoadingBubble'
import EmptyState from './EmptyState'
import HelpModal from './HelpModal'
import LogoCircle from './ui/LogoCircle'

export default function Chat() {
  const { lang, setLang } = useLang()
  const tr = translations[lang]

  const [messages, setMessages]       = useState<ChatMessage[]>([])
  const [input, setInput]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [loadingStatus, setLoadingStatus] = useState(tr.loadingStatuses[0])
  const [helpOpen, setHelpOpen]       = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef    = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { textareaRef.current?.focus() }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (!loading) { setLoadingStatus(tr.loadingStatuses[0]); return }
    let i = 0
    const interval = setInterval(() => {
      i = (i + 1) % tr.loadingStatuses.length
      setLoadingStatus(tr.loadingStatuses[i])
    }, 2500)
    return () => clearInterval(interval)
  }, [loading, tr.loadingStatuses])

  const handleSubmit = useCallback(async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || loading) return

    const userMsg = makeUserMessage(content)
    const historySnapshot = messages

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    try {
      const reply = await sendMessage(content, historySnapshot)
      setMessages((prev) => [...prev, reply])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setMessages((prev) => [...prev, makeErrorMessage(`${tr.loadingStatuses[0].replace('…', '')} — ${msg}`)])
    } finally {
      setLoading(false)
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [input, loading, messages, tr])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSubmit() }
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
        <header className="flex items-center justify-between px-4 sm:px-5 h-14 border-b border-border shrink-0 backdrop-blur-sm bg-bg/80 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <LogoCircle size="sm" />
            <div className="leading-tight">
              <span className="font-serif text-base sm:text-lg text-gold">Ivoire Data</span>
              <p className="text-[10px] text-muted hidden sm:block">{tr.appSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {exchangeCount > 0 && (
              <span className="hidden sm:inline text-[10px] text-muted px-2 py-0.5 rounded-pill border border-border">
                {tr.exchanges(exchangeCount)}
              </span>
            )}

            <span className="hidden sm:inline-flex px-2.5 py-1 text-[10px] font-medium text-green-ci bg-green-dim border border-green-border rounded-pill">
              {tr.badgeLabel}
            </span>

            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
              title="Changer la langue / Switch language"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-muted hover:text-[#F5F5F5] hover:bg-surface2 transition-colors"
            >
              <Languages size={15} />
              <span className="text-[11px] font-medium text-gold uppercase">{lang}</span>
            </button>

            <button
              onClick={() => setHelpOpen(true)}
              title={tr.helpAriaLabel}
              aria-label={tr.helpAriaLabel}
              className="p-2 rounded-lg text-muted hover:text-[#F5F5F5] hover:bg-surface2 transition-colors"
            >
              <HelpCircle size={15} />
            </button>

            {messages.length > 0 && (
              <button
                onClick={handleNewConversation}
                title={tr.newConversation}
                aria-label={tr.newConversation}
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
              placeholder={tr.placeholder}
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
            {tr.sendHint}
            {exchangeCount > 0 && (
              <> · <span className="text-muted/70">{tr.contextHint(exchangeCount * 2)}</span></>
            )}
          </p>
        </div>
      </div>
    </>
  )
}
