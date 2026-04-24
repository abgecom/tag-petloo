"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingDown, Users, CheckCircle2, AlertTriangle } from "lucide-react"

type FunnelStep = {
  step_index: number
  step_id: string
  step_title: string
  step_type: string
  step_phase: string
  is_question: boolean
  reached: number
  reached_pct: number
  dropoff: number
  dropoff_pct: number
}

type AnalyticsData = {
  period_days: number
  total_starts: number
  total_completions: number
  completion_rate_pct: number
  abandonment_rate_pct: number
  funnel: FunnelStep[]
  risk_distribution: {
    moderate: number
    low: number
    critical: number
  }
}

const phaseColors: Record<string, string> = {
  situacional: "bg-blue-100 text-blue-800",
  problema: "bg-red-100 text-red-800",
  desejo: "bg-purple-100 text-purple-800",
  mecanismo: "bg-indigo-100 text-indigo-800",
  personalizacao: "bg-pink-100 text-pink-800",
  loading: "bg-gray-100 text-gray-800",
  resultado: "bg-green-100 text-green-800",
}

export default function QuizAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)

  const fetchData = async (periodDays: number) => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/quiz-analytics?days=${periodDays}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(days)
  }, [days])

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700 font-medium">Erro ao carregar analytics: {error}</p>
        <Button onClick={() => fetchData(days)} className="mt-4">
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (!data) return null

  const biggestDropoffStep = [...data.funnel]
    .filter((s) => s.dropoff > 0)
    .sort((a, b) => b.dropoff_pct - a.dropoff_pct)[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quiz Analytics</h1>
          <p className="text-sm text-gray-600">
            Taxa de avanço e pontos de abandono — últimos {data.period_days} dias
          </p>
        </div>

        {/* Filtro de período */}
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <Button
              key={d}
              size="sm"
              variant={days === d ? "default" : "outline"}
              onClick={() => setDays(d)}
            >
              {d} dias
            </Button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-2">
              <Users className="w-4 h-4" /> Inícios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{data.total_starts}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Conclusões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{data.total_completions}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" /> Taxa de conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {data.completion_rate_pct.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Taxa de abandono
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              {data.abandonment_rate_pct.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ponto de maior abandono */}
      {biggestDropoffStep && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Maior ponto de abandono
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-900">
              <strong>Step {biggestDropoffStep.step_index}</strong> — {biggestDropoffStep.step_id}:{" "}
              <strong>{biggestDropoffStep.dropoff} usuários</strong> ({biggestDropoffStep.dropoff_pct.toFixed(1)}%) abandonam neste passo.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Distribuição de risco (quem completou) */}
      {data.total_completions > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição de risco (quem completou)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: "moderate", label: "Moderado", color: "#EAB308", count: data.risk_distribution.moderate },
              { key: "low", label: "Baixa proteção", color: "#F97316", count: data.risk_distribution.low },
              { key: "critical", label: "Crítico", color: "#EF4444", count: data.risk_distribution.critical },
            ].map((item) => {
              const pct = data.total_completions > 0 ? (item.count / data.total_completions) * 100 : 0
              return (
                <div key={item.key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.label}</span>
                    <span className="font-semibold">
                      {item.count} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Funil de steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Funil por step</CardTitle>
          <p className="text-xs text-gray-600">
            Cada barra mostra quantos chegaram no step. O número em vermelho é quem abandonou neste ponto.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.funnel.map((step) => {
              const phaseColor = phaseColors[step.step_phase] || "bg-gray-100 text-gray-800"
              return (
                <div key={step.step_id} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-mono text-gray-500">#{step.step_index}</span>
                        <span className="text-xs font-mono text-gray-700">{step.step_id}</span>
                        {step.step_phase && (
                          <span className={`text-[10px] px-2 py-0.5 rounded ${phaseColor}`}>
                            {step.step_phase}
                          </span>
                        )}
                        {!step.is_question && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                            não-pergunta
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 leading-snug truncate">{step.step_title}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-gray-900">{step.reached}</p>
                      <p className="text-xs text-gray-500">{step.reached_pct.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${step.reached_pct}%` }}
                      />
                    </div>
                    {step.dropoff > 0 && (
                      <span className="text-xs text-red-600 font-medium whitespace-nowrap">
                        -{step.dropoff} ({step.dropoff_pct.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
