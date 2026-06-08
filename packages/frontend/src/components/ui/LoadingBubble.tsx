export default function LoadingBubble() {
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
