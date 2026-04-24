import { NextResponse, type NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import { quizSteps } from "@/app/quiz/data/quiz-steps"

/**
 * Analytics do quiz: agrega o funil de avanço a partir da tabela
 * quiz_tagloo_results. Retorna KPIs gerais e contagem por step,
 * permitindo identificar onde os usuários abandonam.
 *
 * Query params (escolha uma forma):
 * - days: últimos N dias (default: 30)
 * - start_date + end_date: intervalo ISO (YYYY-MM-DD) — tem prioridade sobre days
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get("start_date")
    const endDateParam = searchParams.get("end_date")

    let since: Date
    let until: Date

    if (startDateParam && endDateParam) {
      since = new Date(`${startDateParam}T00:00:00`)
      until = new Date(`${endDateParam}T23:59:59.999`)
    } else {
      const days = Math.max(1, parseInt(searchParams.get("days") || "30", 10))
      since = new Date()
      since.setDate(since.getDate() - days)
      since.setHours(0, 0, 0, 0)
      until = new Date()
    }

    const { data, error } = await supabase
      .from("quiz_tagloo_results")
      .select(
        "session_id, started_at, completed, completed_at, last_step_id, last_step_index, risk_level"
      )
      .gte("started_at", since.toISOString())
      .lte("started_at", until.toISOString())
      .order("started_at", { ascending: false })

    if (error) {
      console.error("[Quiz Analytics] Erro:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const sessions = data || []
    const totalStarts = sessions.length
    const totalCompletions = sessions.filter((s) => s.completed === true).length
    const completionRate = totalStarts > 0 ? (totalCompletions / totalStarts) * 100 : 0

    const stepFunnel = quizSteps.map((step, index) => {
      const reached = sessions.filter((s) => {
        if (s.completed === true) return true
        if (typeof s.last_step_index === "number") {
          return s.last_step_index >= index
        }
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

    const riskDistribution = {
      moderate: sessions.filter((s) => s.completed && s.risk_level === "moderate").length,
      low: sessions.filter((s) => s.completed && s.risk_level === "low").length,
      critical: sessions.filter((s) => s.completed && s.risk_level === "critical").length,
    }

    return NextResponse.json({
      period: {
        start: since.toISOString(),
        end: until.toISOString(),
      },
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
