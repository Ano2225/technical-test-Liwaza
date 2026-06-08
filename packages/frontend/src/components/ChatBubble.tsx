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
          <strong key={i} className="font-semibold">
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

        // Bullet list
        if (lines.every((l) => !l || l.match(/^[-•*]\s/))) {
          return (
            <ul key={bi} className="my-2 space-y-1">
              {lines
                .filter(Boolean)
                .map((line, li) => (
                  <li key={li} className="flex gap-2">
                    <span className="text-gold mt-0.5 shrink-0">•</span>
                    <span>{renderBold(line.replace(/^[-•*]\s/, ''))}</span>
                  </li>
                ))}
            </ul>
          )
        }

        // Numbered list
        if (lines.every((l) => !l || l.match(/^\d+\.\s/))) {
          return (
            <ol key={bi} className="my-2 space-y-1">
              {lines
                .filter(Boolean)
                .map((line, li) => {
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

        // Normal paragraph
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

// ── Timestamp ─────────────────────────────────────────────────────────────────

function Timestamp({ iso }: { iso: string }) {
  const t = new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return <span className="text-[10px] text-muted mt-1 select-none">{t}</span>
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1 animate-fade-up">
        <div className="max-w-[75%] px-4 py-3 rounded-[18px] rounded-tr-sm bg-gold text-black text-sm leading-relaxed">
          {message.content}
        </div>
        <Timestamp iso={message.timestamp} />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-1 animate-fade-up">
      {message.tool_called && <ToolCallBadge toolName={message.tool_called} />}
      <div className="max-w-[85%] px-4 py-3 rounded-[18px] rounded-tl-sm bg-surface2 text-[#F5F5F5] text-sm">
        {renderMarkdown(message.content)}
        {message.data && <IndicatorCard data={message.data} toolName={message.tool_called} />}
      </div>
      <Timestamp iso={message.timestamp} />
    </div>
  )
}
