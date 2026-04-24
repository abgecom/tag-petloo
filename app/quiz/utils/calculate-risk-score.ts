import { quizSteps } from "../data/quiz-steps"

export type RiskResult = {
  score: number
  level: "moderate" | "low" | "critical"
  color: string
  percentage: number
}

type AnswerMap = Record<string, string | string[] | undefined>

/**
 * Soma pontos de risco com base nos riskWeights dos steps.
 * - Para steps com riskWeight como objeto: soma o peso correspondente à resposta
 * - Para steps com riskWeight numérico (multi-select): soma N * número de seleções
 *
 * Thresholds (score max ≈ 35):
 * - 0-15: moderate (amarelo)
 * - 16-25: low (laranja)
 * - 26+: critical (vermelho)
 */
export function calculateRiskScore(answers: AnswerMap): RiskResult {
  let score = 0

  for (const step of quizSteps) {
    if (!step.saveKey || step.riskWeight === undefined) continue
    const answer = answers[step.saveKey]

    if (typeof step.riskWeight === "number") {
      // multi-select: N pontos por seleção
      if (Array.isArray(answer)) {
        score += step.riskWeight * answer.length
      }
    } else {
      // single-select: peso específico por resposta
      if (typeof answer === "string" && step.riskWeight[answer] !== undefined) {
        score += step.riskWeight[answer]
      }
    }
  }

  // Score máximo estimado: ~35 pontos
  const maxScore = 35

  let level: RiskResult["level"]
  let color: string

  if (score <= 15) {
    level = "moderate"
    color = "#EAB308"
  } else if (score <= 25) {
    level = "low"
    color = "#F97316"
  } else {
    level = "critical"
    color = "#EF4444"
  }

  const percentage = Math.min(100, Math.round((score / maxScore) * 100))

  return { score, level, color, percentage }
}
