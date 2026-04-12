import { createContext, useContext, useEffect, useState } from 'react'
import en, { type Translations } from '@/i18n/en'
import fr from '@/i18n/fr'

type Lang = 'en' | 'fr'

interface LangContextValue {
  lang: Lang
  t: Translations
  setLang: (l: Lang) => void
  toggleLang: () => void
}

const translations: Record<Lang, Translations> = { en, fr }

const LangContext = createContext<LangContextValue>({
  lang: 'en',
  t: en,
  setLang: () => {},
  toggleLang: () => {},
})

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem('ocpp-lang') as Lang | null
    if (stored === 'en' || stored === 'fr') return stored
    return navigator.language.startsWith('fr') ? 'fr' : 'en'
  })

  useEffect(() => {
    localStorage.setItem('ocpp-lang', lang)
    document.documentElement.lang = lang
  }, [lang])

  const setLang = (l: Lang) => setLangState(l)
  const toggleLang = () => setLangState((prev) => (prev === 'en' ? 'fr' : 'en'))

  return (
    <LangContext.Provider value={{ lang, t: translations[lang], setLang, toggleLang }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
