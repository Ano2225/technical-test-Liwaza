export type Lang = 'fr' | 'en'

export interface HelpTool {
  key: string
  label: string
  description: string
  examples: string[]
}

export interface OnboardingStep2Item {
  step: 'chat' | 'ai' | 'data'
  title: string
  body: string
}

interface Translations {
  // Header
  appSubtitle: string
  badgeLabel: string
  exchanges: (n: number) => string
  newConversation: string
  helpAriaLabel: string

  // Empty state
  emptySubtitle: string
  suggestions: string[]

  // Input area
  placeholder: string
  sendHint: string
  contextHint: (n: number) => string

  // Loading
  loadingStatuses: string[]

  // ToolCallBadge
  toolNames: Record<string, string>
  paramLabels: Record<string, string>
  paramsHeading: string
  errorHeading: string
  noParams: string

  // IndicatorCard
  dataYear: (year: string) => string
  indicatorsFound: (n: number) => string
  countryLabels: { capital: string; region: string; income: string; iso: string }

  // Copy button
  copyAriaLabel: string

  // Onboarding
  onboarding: {
    step1Title: string
    step1Body: string
    step2Title: string
    step2Items: OnboardingStep2Item[]
    step3Title: string
    step3Body: string
    step3Suggestions: string[]
    btnNext: string
    btnBack: string
    btnStart: string
    btnSkip: string
  }

  // Help modal
  helpModalTitle: string
  helpModalSubtitle: string
  helpModalFooter: string
  helpTools: HelpTool[]
}

const fr: Translations = {
  appSubtitle: "Assistant IA · données publiques",
  badgeLabel: "IA · World Bank",
  exchanges: (n) => `${n} ${n === 1 ? 'échange' : 'échanges'}`,
  newConversation: "Nouvelle conversation",
  helpAriaLabel: "Aide",

  emptySubtitle: "Explorez les données publiques de la Côte d'Ivoire grâce à l'intelligence artificielle",
  suggestions: [
    "Quel est le PIB de la Côte d'Ivoire ?",
    "Montre-moi le taux d'alphabétisation",
    "Quelle est l'espérance de vie ?",
    "Taux d'inflation ces 5 dernières années",
  ],

  placeholder: "Posez votre question sur la Côte d'Ivoire…",
  sendHint: "Entrée pour envoyer · Maj+Entrée pour un saut de ligne",
  contextHint: (n) => `${n} messages en contexte`,

  loadingStatuses: [
    "Analyse en cours…",
    "Consultation des données…",
    "World Bank API…",
    "Préparation de la réponse…",
  ],

  toolNames: {
    get_country_profile:      "Profil du pays",
    search_indicators:        "Recherche indicateurs",
    get_economic_indicators:  "Indicateurs économiques",
    get_education_indicators: "Indicateurs éducation",
    get_health_indicators:    "Indicateurs santé",
  },
  paramLabels: {
    indicator_id: "Indicateur",
    country_code: "Pays",
    keyword:      "Recherche",
    per_page:     "Résultats",
    page:         "Page",
  },
  paramsHeading: "Paramètres",
  errorHeading:  "Erreur",
  noParams:      "Aucun paramètre",

  dataYear:        (year) => `Données ${year}`,
  indicatorsFound: (n)    => `${new Intl.NumberFormat('fr-FR').format(n)} indicateurs trouvés`,
  countryLabels: {
    capital: "Capitale",
    region:  "Région",
    income:  "Niveau de revenu",
    iso:     "Code ISO",
  },

  copyAriaLabel: "Copier le message",

  onboarding: {
    step1Title: "Bienvenue",
    step1Body: "Explorez les données publiques de la Côte d'Ivoire en posant des questions en langage naturel. Alimenté par l'API World Bank et Claude AI.",
    step2Title: "Comment ça fonctionne",
    step2Items: [
      { step: 'chat', title: "Posez une question",       body: "En français ou en anglais, demandez n'importe quoi sur la Côte d'Ivoire." },
      { step: 'ai',   title: "L'IA choisit l'outil",     body: "Claude identifie la bonne source de données World Bank pour vous." },
      { step: 'data', title: "Obtenez les données réelles", body: "Résultats structurés avec graphiques, tendances et valeurs clés." },
    ],
    step3Title: "Prêt à explorer",
    step3Body: "Voici quelques questions pour commencer :",
    step3Suggestions: [
      "Quel est le PIB de la Côte d'Ivoire ?",
      "Quelle est l'espérance de vie ?",
      "Taux d'alphabétisation des adultes",
    ],
    btnNext:  "Suivant",
    btnBack:  "Retour",
    btnStart: "Commencer",
    btnSkip:  "Passer",
  },

  helpModalTitle:    "Ce que je sais faire",
  helpModalSubtitle: "5 outils · données World Bank · Côte d'Ivoire",
  helpModalFooter:   "Données : Banque Mondiale · api.worldbank.org/v2 · pays CI",
  helpTools: [
    {
      key:         "get_country_profile",
      label:       "Profil du pays",
      description: "Informations générales sur la Côte d'Ivoire : capitale, région, niveau de revenu, coordonnées géographiques.",
      examples:    ["Présente la Côte d'Ivoire", "Quelle est la capitale du pays ?"],
    },
    {
      key:         "get_economic_indicators",
      label:       "Indicateurs économiques",
      description: "PIB, PIB par habitant, taux d'inflation, exportations en % du PIB et autres données macroéconomiques.",
      examples:    ["Quel est le PIB de la Côte d'Ivoire ?", "Évolution du taux d'inflation ces 10 ans"],
    },
    {
      key:         "get_education_indicators",
      label:       "Indicateurs éducation",
      description: "Taux de scolarisation primaire et secondaire, taux d'alphabétisation des adultes.",
      examples:    ["Quel est le taux d'alphabétisation ?", "Scolarisation primaire depuis 2000"],
    },
    {
      key:         "get_health_indicators",
      label:       "Indicateurs santé",
      description: "Mortalité infantile, espérance de vie à la naissance, incidence du VIH.",
      examples:    ["Quelle est l'espérance de vie ?", "Taux de mortalité infantile ces 5 ans"],
    },
    {
      key:         "search_indicators",
      label:       "Recherche d'indicateurs",
      description: "Explore la base World Bank pour trouver des indicateurs par mot-clé.",
      examples:    ["Quels indicateurs existent sur l'emploi ?", "Cherche des données sur la pauvreté"],
    },
  ],
}

const en: Translations = {
  appSubtitle: "AI assistant · public data",
  badgeLabel: "AI · World Bank",
  exchanges: (n) => `${n} ${n === 1 ? 'exchange' : 'exchanges'}`,
  newConversation: "New conversation",
  helpAriaLabel: "Help",

  emptySubtitle: "Explore public data from Côte d'Ivoire through artificial intelligence",
  suggestions: [
    "What is the GDP of Côte d'Ivoire?",
    "Show me the adult literacy rate",
    "What is the life expectancy?",
    "Inflation rate over the last 5 years",
  ],

  placeholder: "Ask a question about Côte d'Ivoire…",
  sendHint: "Enter to send · Shift+Enter for a new line",
  contextHint: (n) => `${n} messages in context`,

  loadingStatuses: [
    "Analysing…",
    "Fetching data…",
    "World Bank API…",
    "Preparing response…",
  ],

  toolNames: {
    get_country_profile:      "Country profile",
    search_indicators:        "Search indicators",
    get_economic_indicators:  "Economic indicators",
    get_education_indicators: "Education indicators",
    get_health_indicators:    "Health indicators",
  },
  paramLabels: {
    indicator_id: "Indicator",
    country_code: "Country",
    keyword:      "Search",
    per_page:     "Results",
    page:         "Page",
  },
  paramsHeading: "Parameters",
  errorHeading:  "Error",
  noParams:      "No parameters",

  dataYear:        (year) => `Data ${year}`,
  indicatorsFound: (n)    => `${new Intl.NumberFormat('en-US').format(n)} indicators found`,
  countryLabels: {
    capital: "Capital city",
    region:  "Region",
    income:  "Income level",
    iso:     "ISO code",
  },

  copyAriaLabel: "Copy message",

  onboarding: {
    step1Title: "Welcome",
    step1Body: "Explore public data from Côte d'Ivoire by asking questions in plain language. Powered by the World Bank API and Claude AI.",
    step2Title: "How it works",
    step2Items: [
      { step: 'chat', title: "Ask a question",     body: "In French or English, ask anything about Côte d'Ivoire." },
      { step: 'ai',   title: "AI selects the tool", body: "Claude identifies the right World Bank dataset for your question." },
      { step: 'data', title: "Get real data",       body: "Structured results with charts, trends, and key figures." },
    ],
    step3Title: "Ready to explore",
    step3Body: "Here are a few questions to get started:",
    step3Suggestions: [
      "What is the GDP of Côte d'Ivoire?",
      "What is the life expectancy?",
      "Adult literacy rate",
    ],
    btnNext:  "Next",
    btnBack:  "Back",
    btnStart: "Get started",
    btnSkip:  "Skip",
  },

  helpModalTitle:    "What I can do",
  helpModalSubtitle: "5 tools · World Bank data · Côte d'Ivoire",
  helpModalFooter:   "Data: World Bank · api.worldbank.org/v2 · country CI",
  helpTools: [
    {
      key:         "get_country_profile",
      label:       "Country profile",
      description: "General information about Côte d'Ivoire: capital city, region, income level, geographic coordinates.",
      examples:    ["Tell me about Côte d'Ivoire", "What is the capital city?"],
    },
    {
      key:         "get_economic_indicators",
      label:       "Economic indicators",
      description: "GDP, GDP per capita, inflation rate, exports as % of GDP and other macroeconomic data.",
      examples:    ["What is the GDP of Côte d'Ivoire?", "Inflation trend over the last 10 years"],
    },
    {
      key:         "get_education_indicators",
      label:       "Education indicators",
      description: "Primary and secondary enrollment rates, adult literacy rate.",
      examples:    ["What is the literacy rate?", "Primary school enrollment since 2000"],
    },
    {
      key:         "get_health_indicators",
      label:       "Health indicators",
      description: "Child mortality, life expectancy at birth, HIV incidence rate.",
      examples:    ["What is the life expectancy?", "Child mortality rate over the last 5 years"],
    },
    {
      key:         "search_indicators",
      label:       "Search indicators",
      description: "Explore the World Bank database to find indicators by keyword.",
      examples:    ["What employment indicators are available?", "Search for poverty data"],
    },
  ],
}

export const translations: Record<Lang, Translations> = { fr, en }
