import { NextResponse, type NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import { quizSteps } from "@/app/quiz/data/quiz-steps"

/**
 * Analytics do quiz: agrega o funil de avanço a partir da tabela
 * quiz_tagloo_results. Retorna KPIs gerais e contagem por step,
 * permitindo identificar onde os usuários abandonam.
 *
 * Query params:
 * - days: filtra sessões iniciadas nos últimos N dias (default: 30)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Math.max(1, parseInt(searchParams.get("days") || "30", 10))

    const since = new Date()
    since.setDate(since.getDate() - days)

    const { data, error } = await supabase
      .from("quiz_tagloo_results")
      .select("session_id, started_at, completed, completed_at, last_step_id, last_step_index, risk_level")
      .gte("started_at", since.toISOString())
      .order("started_at", { ascending: false })

    if (error) {
      console.error("[Quiz Analytics] Erro:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const sessions = data || []
    const totalStarts = sessions.length
    const totalCompletions = sessions.filter((s) => s.completed === true).length
    const completionRate = totalStarts > 0 ? (totalCompletions / totalStarts) * 100 : 0

    // Para cada step, calcular quantas sessões chegaram até ali.
    // "Chegou até o step X" = last_step_index >= X OU completed === true
    const stepFunnel = quizSteps.map((step, index) => {
      const reached = sessions.filter((s) => {
        if (s.completed === true) return true
        if (typeof s.last_step_index === "number") {
          return s.last_step_index >= index
        }
        // Fallback: se não tem last_step_index, só conta o step 0 (start)
        return index === 0
      }).length

      const reachedPct = totalStarts > 0 ? (reached / totalStarts) * 100 : 0

      return {
        step_index: index,
        step_id: step.id,
        step_title: step.title,
        step_type: step.type,
        step_phase: step.phase || "",
        is_question: step.isQuestion === true,
        reached,
        reached_pct: reachedPct,
      }
    })

    // Drop-off entre steps consecutivos
    const stepFunnelWithDropoff = stepFunnel.map((step, i) => {
      const prev = i > 0 ? stepFunnel[i - 1] : null
      const dropoff = prev ? prev.reached - step.reached : 0
      const dropoffPct = prev && prev.reached > 0 ? (dropoff / prev.reached) * 100 : 0
      return {
        ...step,
        dropoff,
        dropoff_pct: dropoffPct,
      }
    })

    // Distribuição de risk_level entre os que completaram
    const riskDistribution = {
      moderate: sessions.filter((s) => s.completed && s.risk_level === "moderate").length,
      low: sessions.filter((s) => s.completed && s.risk_level === "low").length,
      critical: sessions.filter((s) => s.completed && s.risk_level === "critical").length,
    }

    return NextResponse.json({
      period_days: days,
      total_starts: totalStarts,
      total_completions: totalCompletions,
      completion_rate_pct: completionRate,
      abandonment_rate_pct: 100 - completionRate,
      funnel: stepFunnelWithDropoff,
      risk_distribution: riskDistribution,
    })
  } catch (error) {
    console.error("[Quiz Analytics] Erro inesperado:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
