"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { TrendingDown, Users, CheckCircle2, AlertTriangle, CalendarIcon } from "lucide-react"
import { format, subDays, startOfDay, endOfDay, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { DateRange } from "react-day-picker"

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
  period: { start: string; end: string }
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

const phaseColors: Record<string, { bg: string; text: string; fill: string }> = {
  situacional: { bg: "bg-blue-100", text: "text-blue-800", fill: "#3B82F6" },
  problema: { bg: "bg-red-100", text: "text-red-800", fill: "#EF4444" },
  desejo: { bg: "bg-purple-100", text: "text-purple-800", fill: "#A855F7" },
  mecanismo: { bg: "bg-indigo-100", text: "text-indigo-800", fill: "#6366F1" },
  personalizacao: { bg: "bg-pink-100", text: "text-pink-800", fill: "#EC4899" },
  loading: { bg: "bg-gray-100", text: "text-gray-800", fill: "#6B7280" },
  resultado: { bg: "bg-green-100", text: "text-green-800", fill: "#10B981" },
}

function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// Componente do funil visual (trapézios escalonados)
function FunnelVisualization({ funnel }: { funnel: FunnelStep[] }) {
  const maxReached = funnel[0]?.reached || 1
  const maxWidth = 100 // porcentagem

  return (
    <div className="space-y-0">
      {funnel.map((step, i) => {
        const currentPct = maxReached > 0 ? (step.reached / maxReached) * maxWidth : 0
        const nextStep = funnel[i + 1]
        const nextPct =
          nextStep && maxReached > 0 ? (nextStep.reached / maxReached) * maxWidth : currentPct
        const color = phaseColors[step.step_phase]?.fill || "#6B7280"
        const phase = phaseColors[step.step_phase] || { bg: "bg-gray-100", text: "text-gray-700" }
        const isLast = i === funnel.length - 1

        // Trapézio: topo = currentPct, fundo = nextPct
        // SVG polygon coords (em %): inset lateral = (100 - width) / 2
        const topInset = (100 - currentPct) / 2
        const bottomInset = (100 - nextPct) / 2

        return (
          <div key={step.step_id} className="relative">
            <div className="flex items-stretch gap-3">
              {/* Coluna do funil */}
              <div className="relative w-32 sm:w-48 flex-shrink-0">
                <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-12 block">
                  <polygon
                    points={`${topInset},0 ${100 - topInset},0 ${100 - bottomInset},40 ${bottomInset},40`}
                    fill={color}
                    opacity={0.85}
                  />
                  {/* Borda sutil */}
                  <polygon
                    points={`${topInset},0 ${100 - topInset},0 ${100 - bottomInset},40 ${bottomInset},40`}
                    fill="none"
                    stroke="white"
                    strokeWidth="0.5"
                  />
                </svg>
                {/* Indicador do fundo do funil (último) */}
                {isLast && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
                    <div
                      className="w-2 h-2 mt-1"
                      style={{
                        borderLeft: "4px solid transparent",
                        borderRight: "4px solid transparent",
                        borderTop: `6px solid ${color}`,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Info do step */}
              <div className="flex-1 min-w-0 py-2">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-gray-400">#{step.step_index}</span>
                    <span className="text-xs font-mono text-gray-700 truncate max-w-[140px] sm:max-w-none">
                      {step.step_id}
                    </span>
                    {step.step_phase && (
                      <span className={`text-[10px] px-2 py-0.5 rounded ${phase.bg} ${phase.text}`}>
                        {step.step_phase}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-gray-900">{step.reached}</span>
                    <span className="text-xs text-gray-500">({step.reached_pct.toFixed(1)}%)</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{step.step_title}</p>
                {step.dropoff > 0 && (
                  <p className="text-[10px] text-red-600 font-medium mt-0.5">
                    ▼ −{step.dropoff} ({step.dropoff_pct.toFixed(1)}%) abandonaram aqui
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function QuizAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Date range state (default: últimos 30 dias)
  const [range, setRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  })
  const [pickerOpen, setPickerOpen] = useState(false)

  const fetchData = async (from: Date, to: Date) => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        start_date: toISODate(from),
        end_date: toISODate(to),
      })
      const res = await fetch(`/api/quiz-analytics?${params}`)
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
    if (range?.from) {
      const to = range.to || range.from
      fetchData(range.from, to)
    }
  }, [range?.from, range?.to])

  const applyQuickRange = (days: number) => {
    const to = new Date()
    const from = subDays(to, days - 1)
    setRange({ from, to })
  }

  const applyToday = () => {
    const today = new Date()
    setRange({ from: today, to: today })
  }

  const rangeLabel = (() => {
    if (!range?.from) return "Selecionar período"
    const from = range.from
    const to = range.to || range.from
    if (isSameDay(from, to)) {
      return format(from, "d 'de' MMMM, yyyy", { locale: ptBR })
    }
    return `${format(from, "d MMM", { locale: ptBR })} — ${format(to, "d MMM, yyyy", { locale: ptBR })}`
  })()

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
        <Button onClick={() => range?.from && fetchData(range.from, range.to || range.from)} className="mt-4">
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
      {/* Header + Date picker */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quiz Analytics</h1>
          <p className="text-sm text-gray-600">Taxa de avanço e pontos de abandono</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Button size="sm" variant="outline" onClick={applyToday}>
            Hoje
          </Button>
          {[7, 30, 90].map((d) => (
            <Button key={d} size="sm" variant="outline" onClick={() => applyQuickRange(d)}>
              {d}d
            </Button>
          ))}
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="default" size="sm" className="gap-2">
                <CalendarIcon className="w-4 h-4" />
                {rangeLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={range}
                onSelect={setRange}
                numberOfMonths={2}
                locale={ptBR}
                disabled={(date) => date > new Date()}
                defaultMonth={range?.from}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Período selecionado */}
      <p className="text-xs text-gray-500">
        Mostrando dados de {format(new Date(data.period.start), "d 'de' MMMM, yyyy", { locale: ptBR })} até{" "}
        {format(new Date(data.period.end), "d 'de' MMMM, yyyy", { locale: ptBR })}
      </p>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <TrendingDown className="w-4 h-4" /> Conversão
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
              <AlertTriangle className="w-4 h-4" /> Abandono
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              {data.abandonment_rate_pct.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Maior abandono */}
      {biggestDropoffStep && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Maior ponto de abandono
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-900">
              <strong>Step {biggestDropoffStep.step_index}</strong> —{" "}
              <code className="font-mono text-xs">{biggestDropoffStep.step_id}</code>:{" "}
              <strong>{biggestDropoffStep.dropoff} usuários</strong> (
              {biggestDropoffStep.dropoff_pct.toFixed(1)}%) abandonam neste passo.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Distribuição de risco */}
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
              const pct =
                data.total_completions > 0 ? (item.count / data.total_completions) * 100 : 0
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

      {/* Funil visual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Funil do quiz</CardTitle>
          <p className="text-xs text-gray-600">
            Cada etapa do funil estreita conforme usuários avançam. Quanto mais fundo, mais próximo do final do quiz.
            Cores indicam a fase psicológica do step.
          </p>
        </CardHeader>
        <CardContent>
          {data.total_starts === 0 ? (
            <p className="text-center text-gray-500 py-8 text-sm">
              Nenhuma sessão registrada no período selecionado.
            </p>
          ) : (
            <FunnelVisualization funnel={data.funnel} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
