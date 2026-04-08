import { quizSteps } from "../data/quiz-steps"

export type RiskResult = {
  score: number
  level: "moderate" | "low" | "critical"
  color: string
  percentage: number
}

export function calculateRiskScore(answers: Record<string, string>): RiskResult {
  let score = 0

  for (const step of quizSteps) {
    if (step.riskWeight && step.saveKey) {
      const answer = answers[step.saveKey]
      if (answer && step.riskWeight[answer] !== undefined) {
        score += step.riskWeight[answer]
      }
    }
  }

  // Score range: 4-16 (4 steps com riskWeight, cada um 1-4)
  let level: RiskResult["level"]
  let color: string
  let percentage: number

  if (score <= 7) {
    level = "moderate"
    color = "#EAB308" // yellow
    percentage = Math.round((score / 16) * 100)
  } else if (score <= 12) {
    level = "low"
    color = "#F97316" // orange
    percentage = Math.round((score / 16) * 100)
  } else {
    level = "critical"
    color = "#EF4444" // red
    percentage = Math.round((score / 16) * 100)
  }

  return { score, level, color, percentage }
}
