export type StepField = {
  key: string
  label: string
  placeholder: string
  required: boolean
  errorMessage: string
}

export type StepOption = {
  value: string
  label: string
  icon?: string
}

export type LoadingSubStep = {
  text: string
  duration: number
}

export type QuizStep = {
  id: string
  type: "text-input" | "single-select" | "info" | "loading" | "result"
  title: string
  subtitle?: string
  fields?: StepField[]
  options?: StepOption[]
  saveKey?: string
  autoAdvance?: boolean
  riskWeight?: Record<string, number>
  buttonText?: string
  variant?: "warning" | "positive"
  content?: string[]
  imageUrl?: string
  imageAlt?: string
  steps?: LoadingSubStep[]
  totalDuration?: number
  isQuestion?: boolean // conta na barra de progresso
}

export const quizSteps: QuizStep[] = [
  // STEP 0: Nomes (text-input)
  {
    id: "nomes",
    type: "text-input",
    title: "Antes de começar, queremos conhecer vocês!",
    subtitle: "Isso vai nos ajudar a personalizar seu resultado.",
    fields: [
      {
        key: "tutorName",
        label: "Qual é o seu nome?",
        placeholder: "Ex: João",
        required: true,
        errorMessage: "Por favor, digite seu nome",
      },
      {
        key: "petName",
        label: "Qual o nome do seu pet?",
        placeholder: "Ex: Thor",
        required: true,
        errorMessage: "Por favor, digite o nome do seu pet",
      },
    ],
    buttonText: "CONTINUAR",
    isQuestion: true,
  },
  // STEP 1: Cachorro ou Gato
  {
    id: "petType",
    type: "single-select",
    title: "O {{petName}} é um cachorro ou gato?",
    options: [
      { value: "cachorro", label: "Cachorro", icon: "🐕" },
      { value: "gato", label: "Gato", icon: "🐈" },
    ],
    saveKey: "petType",
    autoAdvance: true,
    isQuestion: true,
  },
  // STEP 2: Onde mora
  {
    id: "location",
    type: "single-select",
    title: "Onde vocês moram?",
    subtitle: "Isso influencia no nível de risco do {{petName}}.",
    options: [
      { value: "cidade-grande", label: "Cidade grande (capital/metrópole)" },
      { value: "cidade-media", label: "Cidade de médio porte" },
      { value: "cidade-pequena", label: "Cidade pequena/interior" },
      { value: "zona-rural", label: "Zona rural/sítio/fazenda" },
    ],
    saveKey: "location",
    autoAdvance: true,
    riskWeight: {
      "cidade-grande": 3,
      "cidade-media": 2,
      "cidade-pequena": 1,
      "zona-rural": 2,
    },
    isQuestion: true,
  },
  // STEP 3: Pet já fugiu
  {
    id: "alreadyLost",
    type: "single-select",
    title: "O {{petName}} já fugiu ou se perdeu alguma vez?",
    options: [
      { value: "sim-perdeu", label: "Sim, já se perdeu e foi difícil encontrar" },
      { value: "sim-fugiu-voltou", label: "Sim, já fugiu mas conseguiu voltar" },
      { value: "nao-nunca", label: "Não, nunca aconteceu" },
      { value: "medo", label: "Nunca, mas tenho muito medo que aconteça" },
    ],
    saveKey: "alreadyLost",
    autoAdvance: true,
    riskWeight: {
      "sim-perdeu": 4,
      "sim-fugiu-voltou": 3,
      "nao-nunca": 1,
      medo: 2,
    },
    isQuestion: true,
  },
  // STEP 4: Onde o pet passa mais tempo
  {
    id: "petRoutine",
    type: "single-select",
    title: "Onde o {{petName}} passa a maior parte do tempo?",
    options: [
      { value: "dentro-casa", label: "Sempre dentro de casa/apartamento" },
      { value: "quintal", label: "No quintal ou área externa" },
      { value: "passeios", label: "Passeia comigo na rua diariamente" },
      { value: "acesso-livre", label: "Tem acesso livre à rua (entra e sai)" },
    ],
    saveKey: "petRoutine",
    autoAdvance: true,
    riskWeight: {
      "dentro-casa": 1,
      quintal: 2,
      passeios: 2,
      "acesso-livre": 4,
    },
    isQuestion: true,
  },
  // STEP 5: Tela educativa — perigo
  {
    id: "info-danger",
    type: "info",
    variant: "warning",
    title: "Você sabia?",
    content: [
      "Segundo o Instituto Pet Brasil, **mais de 30 milhões de animais vivem em situação de abandono** no país.",
      "E a maioria dos pets que foge de casa **não tem nenhuma forma de identificação** — o que torna quase impossível o reencontro.",
      "A cada dia, milhares de tutores passam pela angústia de não saber onde seu pet está.",
    ],
    buttonText: "ENTENDI, CONTINUAR",
    isQuestion: false,
  },
  // STEP 6: Usa identificação
  {
    id: "currentProtection",
    type: "single-select",
    title: "O {{petName}} usa alguma identificação hoje?",
    subtitle: "Plaquinha, microchip, tag... qualquer coisa que ajude a identificar ele.",
    options: [
      { value: "plaquinha", label: "Sim, uma plaquinha com nome e telefone" },
      { value: "microchip", label: "Sim, tem microchip implantado" },
      { value: "nada", label: "Não usa nada de identificação" },
      { value: "nao-sei", label: "Não tenho certeza" },
    ],
    saveKey: "currentProtection",
    autoAdvance: true,
    riskWeight: {
      plaquinha: 2,
      microchip: 1,
      nada: 4,
      "nao-sei": 3,
    },
    isQuestion: true,
  },
  // STEP 7: Pergunta emocional
  {
    id: "biggestFear",
    type: "single-select",
    title: "Se o {{petName}} se perdesse hoje, qual seria sua maior preocupação?",
    options: [
      { value: "nao-saber-onde", label: "Não saber onde ele está naquele momento" },
      { value: "nao-devolver", label: "Alguém encontrar e não devolver" },
      { value: "sofrer-rua", label: "Ele sofrer na rua sozinho" },
      { value: "nunca-mais-ver", label: "Nunca mais ver ele" },
    ],
    saveKey: "biggestFear",
    autoAdvance: true,
    isQuestion: true,
  },
  // STEP 8: Tela educativa — solução
  {
    id: "info-solution",
    type: "info",
    variant: "positive",
    title: "A boa notícia...",
    content: [
      "Existe uma forma simples e acessível de **nunca mais passar por essa preocupação**.",
      "Tutores que usam tags inteligentes de rastreamento conseguem localizar seus pets em **tempo real**, a qualquer momento, direto pelo celular.",
      "E o melhor: funciona mesmo que outra pessoa encontre seu pet — basta aproximar o celular da tag.",
    ],
    buttonText: "VER MEU RESULTADO",
    isQuestion: false,
  },
  // STEP 9: Conhece rastreamento
  {
    id: "awareness",
    type: "single-select",
    title: "Você já conhece ou já ouviu falar em tags de rastreamento para pets?",
    options: [
      { value: "sim-conheço", label: "Sim, já conheço e tenho interesse" },
      { value: "ja-ouvi", label: "Já ouvi falar mas não sei bem como funciona" },
      { value: "nao-conheço", label: "Não, é novidade pra mim" },
    ],
    saveKey: "awareness",
    autoAdvance: true,
    isQuestion: true,
  },
  // STEP 10: Loading
  {
    id: "loading-analysis",
    type: "loading",
    title: "Analisando o perfil de proteção do {{petName}}...",
    steps: [
      { text: "Avaliando rotina e ambiente...", duration: 1500 },
      { text: "Calculando nível de risco...", duration: 1500 },
      { text: "Gerando recomendação personalizada...", duration: 2000 },
    ],
    autoAdvance: true,
    totalDuration: 5000,
    isQuestion: false,
  },
  // STEP 11: Resultado
  {
    id: "result",
    type: "result",
    title: "",
    isQuestion: false,
  },
]

// Total de steps que são perguntas reais (para a barra de progresso)
export const totalQuestionSteps = quizSteps.filter((s) => s.isQuestion).length
