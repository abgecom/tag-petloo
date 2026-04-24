import type { QuizData } from "../context/quiz-context"

export async function saveQuizStart(data: QuizData) {
  try {
    const response = await fetch("/api/quiz-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "start",
        session_id: data.sessionId,
        tutor_name: data.tutorName,
        pet_name: data.petName,
        started_at: data.startedAt,
        utm_source: data.utmSource || null,
        utm_medium: data.utmMedium || null,
        utm_campaign: data.utmCampaign || null,
      }),
    })
    if (!response.ok) console.error("[Quiz] Erro ao salvar início:", response.status)
  } catch (error) {
    console.error("[Quiz] Erro ao salvar início:", error)
  }
}

export async function saveQuizComplete(data: QuizData) {
  try {
    const response = await fetch("/api/quiz-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "complete",
        session_id: data.sessionId,
        tutor_name: data.tutorName,
        pet_name: data.petName,
        pet_type: data.petType,
        pet_gender: data.petGender,
        pet_size: data.petSize,
        location: data.location,
        already_lost: data.alreadyLost,
        pet_routine: data.petRoutine,
        risk_situations: data.riskSituations,
        current_protection: data.currentProtection,
        biggest_fear: data.biggestFear,
        time_to_notice: data.timeToNotice,
        desired_feeling: data.desiredFeeling,
        would_invest: data.wouldInvest,
        priorities: data.priorities,
        awareness: data.awareness,
        tag_color: data.tagColor,
        risk_score: data.riskScore,
        risk_level: data.riskLevel,
        all_answers: {
          petType: data.petType,
          petGender: data.petGender,
          petSize: data.petSize,
          location: data.location,
          alreadyLost: data.alreadyLost,
          petRoutine: data.petRoutine,
          riskSituations: data.riskSituations,
          currentProtection: data.currentProtection,
          biggestFear: data.biggestFear,
          timeToNotice: data.timeToNotice,
          desiredFeeling: data.desiredFeeling,
          wouldInvest: data.wouldInvest,
          priorities: data.priorities,
          awareness: data.awareness,
          tagColor: data.tagColor,
        },
        completed: true,
        completed_at: new Date().toISOString(),
        started_at: data.startedAt,
        utm_source: data.utmSource || null,
        utm_medium: data.utmMedium || null,
        utm_campaign: data.utmCampaign || null,
      }),
    })
    if (!response.ok) console.error("[Quiz] Erro ao salvar resultado:", response.status)
  } catch (error) {
    console.error("[Quiz] Erro ao salvar resultado:", error)
  }
}
