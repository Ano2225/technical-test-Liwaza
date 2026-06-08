export default function DataCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-card border-l-2 border-gold bg-surface2 p-4 text-sm animate-fade-up">
      {children}
    </div>
  )
}
