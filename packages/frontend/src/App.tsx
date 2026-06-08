import { LanguageProvider } from '@/lib/LanguageContext'
import Chat from '@/components/Chat'

export default function App() {
  return (
    <LanguageProvider>
      <Chat />
    </LanguageProvider>
  )
}
