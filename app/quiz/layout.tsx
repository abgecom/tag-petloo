import { QuizProvider } from "./context/quiz-context"

export const metadata = {
  title: "Teste de Proteção Pet | Petloo",
  description:
    "Descubra se seu pet está realmente protegido. Quiz rápido e gratuito para avaliar o nível de segurança do seu melhor amigo.",
}

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <QuizProvider>{children}</QuizProvider>
}
