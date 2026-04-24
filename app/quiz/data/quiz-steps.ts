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
  description?: string
  color?: string
}

export type LoadingSubStep = {
  text: string
  duration: number
}

export type StepType =
  | "text-input"
  | "single-select"
  | "multi-select"
  | "info"
  | "loading"
  | "result"
  | "color-select"

export type StepPhase =
  | "situacional"
  | "problema"
  | "desejo"
  | "mecanismo"
  | "personalizacao"
  | "loading"
  | "resultado"

export type QuizStep = {
  id: string
  type: StepType
  phase?: StepPhase
  title: string
  subtitle?: string
  fields?: StepField[]
  options?: StepOption[]
  saveKey?: string
  autoAdvance?: boolean
  riskWeight?: Record<string, number> | number
  buttonText?: string
  variant?: "warning" | "positive" | "neutral"
  content?: string[]
  highlight?: string
  imageUrl?: string
  imageAlt?: string
  steps?: LoadingSubStep[]
  totalDuration?: number
  isQuestion?: boolean
  minSelections?: number
  maxSelections?: number
  nextStepTeaser?: string
  dynamicContent?: boolean
}

export const quizSteps: QuizStep[] = [
  // ============ FASE 1: SITUACIONAL ============

  // STEP 0: Nomes
  {
    id: "nomes",
    type: "text-input",
    phase: "situacional",
    title: "Vamos personalizar tudo para vocês!",
    subtitle: "O resultado será 100% personalizado com base nas suas respostas.",
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
        label: "E o nome do seu pet?",
        placeholder: "Ex: Thor",
        required: true,
        errorMessage: "Por favor, digite o nome do seu pet",
      },
    ],
    buttonText: "CONTINUAR →",
    nextStepTeaser: "Na próxima etapa, vamos conhecer melhor o {{petName}}!",
    isQuestion: true,
  },

  // STEP 1: Tipo de pet
  {
    id: "petType",
    type: "single-select",
    phase: "situacional",
    title: "O {{petName}} é um cachorro ou gato?",
    subtitle: "Isso vai nos ajudar a personalizar as recomendações.",
    options: [
      { value: "cachorro", label: "Cachorro", icon: "🐕" },
      { value: "gato", label: "Gato", icon: "🐈" },
    ],
    saveKey: "petType",
    autoAdvance: true,
    isQuestion: true,
  },

  // STEP 2: Sexo
  {
    id: "petGender",
    type: "single-select",
    phase: "situacional",
    title: "O {{petName}} é macho ou fêmea?",
    options: [
      { value: "macho", label: "Macho", icon: "♂️" },
      { value: "femea", label: "Fêmea", icon: "♀️" },
    ],
    saveKey: "petGender",
    autoAdvance: true,
    isQuestion: true,
  },

  // STEP 3: Porte
  {
    id: "petSize",
    type: "single-select",
    phase: "situacional",
    title: "Qual o porte do {{petName}}?",
    subtitle: "Isso define o tamanho ideal da coleira e da tag.",
    options: [
      { value: "pequeno", label: "Pequeno", icon: "🐾", description: "Até 10kg — Gatos e cães pequenos" },
      { value: "medio", label: "Médio", icon: "🐕", description: "10 a 25kg — Cães de porte médio" },
      { value: "grande", label: "Grande", icon: "🦮", description: "Acima de 25kg — Cães de porte grande" },
    ],
    saveKey: "petSize",
    autoAdvance: true,
    isQuestion: true,
  },

  // STEP 4: Localização
  {
    id: "location",
    type: "single-select",
    phase: "situacional",
    title: "Onde vocês moram, {{tutorName}}?",
    subtitle: "A localização influencia diretamente no nível de risco.",
    options: [
      { value: "capital", label: "Capital ou região metropolitana", icon: "🏙️" },
      { value: "cidade-media", label: "Cidade de médio porte", icon: "🏘️" },
      { value: "cidade-pequena", label: "Cidade pequena ou interior", icon: "🏡" },
      { value: "zona-rural", label: "Zona rural, sítio ou fazenda", icon: "🌾" },
    ],
    saveKey: "location",
    autoAdvance: true,
    riskWeight: {
      capital: 4,
      "cidade-media": 3,
      "cidade-pequena": 2,
      "zona-rural": 3,
    },
    nextStepTeaser: "Agora vamos entender a rotina do {{petName}} e avaliar os riscos...",
    isQuestion: true,
  },

  // ============ FASE 2: PROBLEMA ============

  // STEP 5: Rotina do pet
  {
    id: "petRoutine",
    type: "single-select",
    phase: "problema",
    title: "Como é a rotina do {{petName}} com a rua?",
    options: [
      { value: "acesso-livre", label: "Entra e sai livremente — tem acesso à rua" },
      { value: "passeios-diarios", label: "Passeia comigo diariamente na rua" },
      { value: "quintal-aberto", label: "Fica no quintal, mas o portão nem sempre está fechado" },
      { value: "dentro-casa", label: "Fica dentro de casa, mas às vezes escapa quando abre a porta" },
    ],
    saveKey: "petRoutine",
    autoAdvance: true,
    riskWeight: {
      "acesso-livre": 5,
      "passeios-diarios": 3,
      "quintal-aberto": 4,
      "dentro-casa": 2,
    },
    isQuestion: true,
  },

  // STEP 6: Já fugiu?
  {
    id: "alreadyLost",
    type: "single-select",
    phase: "problema",
    title: "O {{petName}} já fugiu ou se perdeu alguma vez?",
    options: [
      { value: "sim-dificil", label: "Sim, já se perdeu e foi muito difícil encontrar" },
      { value: "sim-voltou", label: "Sim, já fugiu mas conseguiu voltar sozinho" },
      { value: "quase", label: "Quase! Já teve situações de quase fuga" },
      { value: "medo-constante", label: "Ainda não, mas vivo com medo de que aconteça" },
    ],
    saveKey: "alreadyLost",
    autoAdvance: true,
    riskWeight: {
      "sim-dificil": 5,
      "sim-voltou": 4,
      quase: 3,
      "medo-constante": 3,
    },
    isQuestion: true,
  },

  // STEP 7: Situações de risco (multi-select)
  {
    id: "riskSituations",
    type: "multi-select",
    phase: "problema",
    title: "Quais dessas situações já aconteceram com o {{petName}}?",
    subtitle: "Selecione todas que se aplicam.",
    options: [
      { value: "fogos", label: "Já se assustou com fogos de artifício e tentou fugir", icon: "🎆" },
      { value: "portao", label: "Já saiu correndo quando abriram o portão ou a porta", icon: "🚪" },
      { value: "passeio", label: "Já puxou a guia e quase escapou no passeio", icon: "🏃" },
      { value: "cio", label: "Já saiu atrás de outro animal no cio", icon: "💕" },
      { value: "barulho", label: "Já se assustou com trovão ou barulho forte", icon: "⛈️" },
      { value: "visita", label: "Já saiu quando chegaram visitas e a porta ficou aberta", icon: "👥" },
    ],
    saveKey: "riskSituations",
    minSelections: 1,
    buttonText: "CONTINUAR →",
    riskWeight: 1, // cada seleção soma 1 ponto
    isQuestion: true,
  },

  // STEP 8: Tela educativa - DADO CHOCANTE
  {
    id: "info-shock",
    type: "info",
    phase: "problema",
    variant: "warning",
    title: "{{tutorName}}, isso é sério...",
    imageUrl: "/images/step9_202604232315.jpeg",
    imageAlt: "Pets em situação de risco",
    content: [
      "**1 a cada 3 pets foge de casa** pelo menos uma vez na vida.",
      "Desses, **apenas 10% são encontrados** quando não possuem nenhuma forma de identificação ou rastreamento.",
      "No Brasil, **mais de 30 milhões de animais** vivem em situação de abandono — muitos deles tinham um lar.",
    ],
    highlight: "As respostas do {{petName}} até aqui indicam pontos de atenção. Vamos avaliar melhor.",
    buttonText: "CONTINUAR AVALIAÇÃO →",
    isQuestion: false,
  },

  // STEP 9: Proteção atual
  {
    id: "currentProtection",
    type: "single-select",
    phase: "problema",
    title: "Hoje, o {{petName}} usa alguma forma de identificação?",
    subtitle: "Plaquinha, microchip, coleira com nome... qualquer coisa.",
    options: [
      { value: "plaquinha", label: "Sim, tem plaquinha na coleira — mas se a coleira sair, perde tudo" },
      { value: "microchip", label: "Tem microchip, mas só funciona se alguém levar ao veterinário" },
      { value: "nada", label: "Não usa nada de identificação" },
      { value: "nao-sei", label: "Não tenho certeza se o que tem é suficiente" },
    ],
    saveKey: "currentProtection",
    autoAdvance: true,
    riskWeight: {
      plaquinha: 3,
      microchip: 2,
      nada: 5,
      "nao-sei": 4,
    },
    isQuestion: true,
  },

  // STEP 10: Maior medo
  {
    id: "biggestFear",
    type: "single-select",
    phase: "problema",
    title: "Se o {{petName}} sumisse agora, o que mais te preocuparia?",
    options: [
      { value: "nao-saber-onde", label: "Não saber onde ele está naquele momento" },
      { value: "sofrer-sozinho", label: "Saber que ele pode estar sofrendo sozinho na rua" },
      { value: "nao-devolver", label: "Alguém encontrar e decidir não devolver" },
      { value: "nunca-mais-ver", label: "A possibilidade de nunca mais ver ele" },
    ],
    saveKey: "biggestFear",
    autoAdvance: true,
    isQuestion: true,
  },

  // STEP 11: Tempo para perceber
  {
    id: "timeToNotice",
    type: "single-select",
    phase: "problema",
    title: "Se o {{petName}} saísse de casa agora, quanto tempo levaria para você perceber?",
    options: [
      { value: "horas", label: "Provavelmente demoraria horas até eu notar" },
      { value: "minutos-30", label: "Uns 30 minutos, talvez mais" },
      { value: "minutos-10", label: "Menos de 10 minutos, mas já seria tarde" },
      { value: "imediatamente", label: "Na hora — mas não saberia para onde ele foi" },
    ],
    saveKey: "timeToNotice",
    autoAdvance: true,
    riskWeight: {
      horas: 5,
      "minutos-30": 4,
      "minutos-10": 3,
      imediatamente: 2,
    },
    nextStepTeaser: "Agora vamos entender como você imagina a proteção ideal para o {{petName}}...",
    isQuestion: true,
  },

  // ============ FASE 3: DESEJO ============

  // STEP 12: Visualização do desejo
  {
    id: "desiredFeeling",
    type: "single-select",
    phase: "desejo",
    title:
      "Imagina poder abrir o celular e ver onde o {{petName}} está, em tempo real. Como você se sentiria?",
    options: [
      { value: "alivio-total", label: "Sentiria um alívio enorme — finalmente tranquilidade" },
      { value: "seguranca", label: "Me sentiria muito mais seguro(a) como tutor(a)" },
      { value: "necessidade", label: "Isso é exatamente o que eu preciso" },
      { value: "todos", label: "Todas as opções acima — quero tudo isso" },
    ],
    saveKey: "desiredFeeling",
    autoAdvance: true,
    isQuestion: true,
  },

  // STEP 13: Comprometimento
  {
    id: "wouldInvest",
    type: "single-select",
    phase: "desejo",
    title:
      "Se existisse uma forma simples e acessível de proteger o {{petName}} 24 horas por dia, você investiria nisso?",
    options: [
      { value: "com-certeza", label: "Com certeza! A segurança dele não tem preço" },
      { value: "se-acessivel", label: "Sim, se for algo que cabe no meu bolso" },
      { value: "preciso-ver", label: "Preciso entender melhor como funciona, mas tenho interesse" },
    ],
    saveKey: "wouldInvest",
    autoAdvance: true,
    isQuestion: true,
  },

  // STEP 14: Prioridades (multi-select)
  {
    id: "priorities",
    type: "multi-select",
    phase: "desejo",
    title: "O que é mais importante pra você na hora de proteger o {{petName}}?",
    subtitle: "Selecione os que mais importam.",
    options: [
      { value: "gps-tempo-real", label: "Saber a localização em tempo real", icon: "📍" },
      { value: "alerta-fuga", label: "Receber alerta se ele sair de uma área segura", icon: "🔔" },
      { value: "historico", label: "Ver o histórico de onde ele andou", icon: "🗺️" },
      { value: "facil-usar", label: "Ser fácil de usar, direto pelo celular", icon: "📱" },
      { value: "resistente", label: "Ser resistente à água e ao dia a dia do pet", icon: "💧" },
      { value: "personalizado", label: "Ser personalizado com o nome do meu pet", icon: "✨" },
    ],
    saveKey: "priorities",
    minSelections: 1,
    buttonText: "CONTINUAR →",
    nextStepTeaser: "Boa notícia: tudo que você selecionou existe em uma solução. Vamos te mostrar!",
    isQuestion: true,
  },

  // ============ FASE 4: MECANISMO ============

  // STEP 15: Tela educativa - SOLUÇÃO
  {
    id: "info-solution",
    type: "info",
    phase: "mecanismo",
    variant: "positive",
    title: "{{tutorName}}, existe uma solução para tudo isso!",
    imageUrl: "/images/step16_202604232315.jpeg",
    imageAlt: "Pet protegido com tag de rastreamento",
    content: [
      "Tutores inteligentes estão usando **tags de rastreamento GPS** que permitem localizar o pet em **tempo real**, a qualquer momento, direto pelo celular.",
      "É simples: a tag vai na coleira do {{petName}} e você acompanha tudo pelo app — localização ao vivo, histórico de passeios e alertas se ele sair de uma área segura.",
      "**Mais de 2.000 pets já foram encontrados** graças a essa tecnologia. Pets que poderiam ter virado estatística.",
    ],
    highlight: "E o melhor: a tag é personalizada para o porte e estilo do {{petName}}.",
    buttonText: "QUERO CONHECER →",
    isQuestion: false,
  },

  // STEP 16: Awareness
  {
    id: "awareness",
    type: "single-select",
    phase: "mecanismo",
    title: "Você já conhece ou já ouviu falar em tags de rastreamento GPS para pets?",
    options: [
      { value: "sim-interesse", label: "Sim, já conheço e tenho muito interesse" },
      { value: "ja-ouvi", label: "Já ouvi falar, mas não sei como funciona na prática" },
      { value: "novidade", label: "É novidade pra mim — e parece exatamente o que preciso" },
    ],
    saveKey: "awareness",
    autoAdvance: true,
    nextStepTeaser: "Agora vamos personalizar a proteção ideal para o {{petName}}!",
    isQuestion: true,
  },

  // ============ FASE 5: PERSONALIZAÇÃO ============

  // STEP 17: Cor da tag (color-select)
  {
    id: "tagColor",
    type: "color-select",
    phase: "personalizacao",
    title: "Qual cor combina mais com o {{petName}}?",
    subtitle: "Escolha a cor da tag de rastreamento.",
    options: [
      {
        value: "laranja",
        label: "Laranja",
        color: "#F97316",
        description: "Vibrante e fácil de identificar",
      },
      {
        value: "roxo",
        label: "Roxo",
        color: "#8B5CF6",
        description: "Elegante e diferenciado",
      },
    ],
    saveKey: "tagColor",
    autoAdvance: true,
    isQuestion: true,
  },

  // STEP 18: Confirmação do perfil
  {
    id: "profile-summary",
    type: "info",
    phase: "personalizacao",
    variant: "neutral",
    title: "Perfeito! Aqui está o perfil do {{petName}}:",
    dynamicContent: true,
    buttonText: "GERAR MEU DIAGNÓSTICO PERSONALIZADO →",
    nextStepTeaser: "Estamos preparando seu resultado completo...",
    isQuestion: false,
  },

  // ============ FASE 6: LOADING ============

  // STEP 19: Loading
  {
    id: "loading-analysis",
    type: "loading",
    phase: "loading",
    title: "Construindo o plano de proteção do {{petName}}...",
    steps: [
      { text: "Analisando rotina e ambiente...", duration: 1500 },
      { text: "Calculando nível de risco para {{petType}} porte {{petSize}}...", duration: 1500 },
      { text: "Avaliando vulnerabilidades identificadas...", duration: 1500 },
      { text: "Selecionando tag {{tagColor}} tamanho {{petSize}}...", duration: 1500 },
      { text: "Gerando diagnóstico personalizado para o {{petName}}...", duration: 2000 },
    ],
    autoAdvance: true,
    totalDuration: 8000,
    isQuestion: false,
  },

  // ============ FASE 7: RESULTADO ============

  // STEP 20: Resultado
  {
    id: "result",
    type: "result",
    phase: "resultado",
    title: "",
    isQuestion: false,
  },
]

// Total de steps que são perguntas reais (para a barra de progresso)
export const totalQuestionSteps = quizSteps.filter((s) => s.isQuestion).length
