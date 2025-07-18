"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"

interface DateRangePickerProps {
  startDate: string
  endDate: string
  onChange: (dateRange: { startDate: string; endDate: string }) => void
}

export function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempStartDate, setTempStartDate] = useState(startDate)
  const [tempEndDate, setTempEndDate] = useState(endDate)

  const handleApply = () => {
    onChange({
      startDate: tempStartDate,
      endDate: tempEndDate,
    })
    setIsOpen(false)
  }

  const handlePresetClick = (days: number) => {
    const end = new Date()
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const newStartDate = start.toISOString().split("T")[0]
    const newEndDate = end.toISOString().split("T")[0]

    setTempStartDate(newStartDate)
    setTempEndDate(newEndDate)
    onChange({
      startDate: newStartDate,
      endDate: newEndDate,
    })
    setIsOpen(false)
  }

  const formatDateRange = () => {
    const start = new Date(startDate).toLocaleDateString("pt-BR")
    const end = new Date(endDate).toLocaleDateString("pt-BR")
    return `${start} - ${end}`
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[280px] justify-start text-left font-normal bg-transparent">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Selecionar período</h4>
            <p className="text-sm text-muted-foreground">Escolha o período para visualizar os dados</p>
          </div>

          {/* Presets */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => handlePresetClick(1)}>
              Hoje
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePresetClick(7)}>
              7 dias
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePresetClick(30)}>
              30 dias
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePresetClick(90)}>
              90 dias
            </Button>
          </div>

          {/* Custom Date Range */}
          <div className="space-y-2">
            <div>
              <Label htmlFor="start-date">Data inicial</Label>
              <Input
                id="start-date"
                type="date"
                value={tempStartDate}
                onChange={(e) => setTempStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date">Data final</Label>
              <Input id="end-date" type="date" value={tempEndDate} onChange={(e) => setTempEndDate(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleApply} className="flex-1">
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
