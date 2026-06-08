export default function DataCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 sm:mt-3 rounded-card border-l-2 border-gold bg-surface2 p-3 sm:p-4 text-xs sm:text-sm animate-fade-up">
      {children}
    </div>
  )
}
