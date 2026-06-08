import { useState } from 'react'
import { Copy, Check, AlertCircle } from 'lucide-react'
import type { ChatMessage } from '@/lib/api'
import ToolCallBadge from './ToolCallBadge'
import IndicatorCard from './IndicatorCard'

interface Props {
  message: ChatMessage
}

// ── Markdown renderer ─────────────────────────────────────────────────────────

function renderBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="font-semibold text-[#F5F5F5]">
            {part.slice(2, -2)}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  )
}

function renderMarkdown(text: string): React.ReactNode {
  const blocks = text.split(/\n\n+/)
  return (
    <>
      {blocks.map((block, bi) => {
        const lines = block.split('\n')

        if (lines.every((l) => !l || l.match(/^[-•*]\s/))) {
          return (
            <ul key={bi} className="my-2 space-y-1.5">
              {lines.filter(Boolean).map((line, li) => (
                <li key={li} className="flex gap-2">
                  <span className="text-gold mt-0.5 shrink-0 select-none">•</span>
                  <span>{renderBold(line.replace(/^[-•*]\s/, ''))}</span>
                </li>
              ))}
            </ul>
          )
        }

        if (lines.every((l) => !l || l.match(/^\d+\.\s/))) {
          return (
            <ol key={bi} className="my-2 space-y-1.5">
              {lines.filter(Boolean).map((line, li) => {
                const m = line.match(/^(\d+)\.\s(.+)/)
                return (
                  <li key={li} className="flex gap-2">
                    <span className="text-gold font-medium shrink-0 min-w-[1.2rem]">{m?.[1]}.</span>
                    <span>{renderBold(m?.[2] ?? line)}</span>
                  </li>
                )
              })}
            </ol>
          )
        }

        return (
          <p key={bi} className="my-1 leading-relaxed">
            {lines.map((line, li) => (
              <span key={li}>
                {renderBold(line)}
                {li < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        )
      })}
    </>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Timestamp({ iso }: { iso: string }) {
  const t = new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return <span className="text-[10px] text-muted select-none">{t}</span>
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      aria-label="Copier le message"
      className="p-1 rounded hover:bg-surface2 text-muted hover:text-[#F5F5F5] transition-all duration-150 opacity-0 group-hover:opacity-100"
    >
      {copied
        ? <Check size={12} className="text-green-ci" />
        : <Copy size={12} />}
    </button>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1 animate-fade-up">
        <div className="max-w-[80%] sm:max-w-[75%] px-3 sm:px-4 py-2.5 sm:py-3 rounded-[18px] rounded-tr-sm bg-gold text-black text-xs sm:text-sm leading-relaxed font-medium">
          {message.content}
        </div>
        <Timestamp iso={message.timestamp} />
      </div>
    )
  }

  if (message.isError) {
    return (
      <div className="flex flex-col items-start gap-1 animate-fade-up">
        <div className="max-w-[90%] sm:max-w-[85%] flex items-start gap-2.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-[18px] rounded-tl-sm bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{message.content}</span>
        </div>
        <Timestamp iso={message.timestamp} />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-1.5 animate-fade-up group">
      {/* Text response */}
      <div className="max-w-[90%] sm:max-w-[85%] px-3 sm:px-4 py-2.5 sm:py-3 rounded-[18px] rounded-tl-sm bg-surface2 text-[#F5F5F5] text-xs sm:text-sm">
        {renderMarkdown(message.content)}
      </div>

      {/* Tool calls — one section per call */}
      {message.tool_calls && message.tool_calls.length > 0 && (
        <div className="max-w-[85%] w-full space-y-3 pl-1">
          {message.tool_calls.map((call, i) => (
            <div key={i} className="space-y-1">
              <ToolCallBadge call={call} />
              {!('error' in call.result) && (
                <IndicatorCard data={call.result} toolName={call.tool} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer: timestamp + copy */}
      <div className="flex items-center gap-1 pl-1">
        <Timestamp iso={message.timestamp} />
        <CopyButton text={message.content} />
      </div>
    </div>
  )
}
