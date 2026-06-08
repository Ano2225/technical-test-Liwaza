import { createContext, useContext, useState } from 'react'
import type { Lang } from './i18n'

interface LanguageContextType {
  lang: Lang
  setLang: (l: Lang) => void
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'fr',
  setLang: () => {},
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem('ivoire_lang') as Lang | null) ?? 'en'
  })

  const handleSetLang = (l: Lang) => {
    setLang(l)
    localStorage.setItem('ivoire_lang', l)
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLang = () => useContext(LanguageContext)
