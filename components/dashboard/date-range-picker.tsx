"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DateRangePickerProps {
  from: Date
  to: Date
  onDateRangeChange: (from: Date, to: Date) => void
}

export function DateRangePicker({ from, to, onDateRangeChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      onDateRangeChange(range.from, range.to)
      setIsOpen(false)
    }
  }

  const presetRanges = [
    {
      label: "Hoje",
      range: {
        from: new Date(),
        to: new Date(),
      },
    },
    {
      label: "Ontem",
      range: {
        from: new Date(new Date().setDate(new Date().getDate() - 1)),
        to: new Date(new Date().setDate(new Date().getDate() - 1)),
      },
    },
    {
      label: "Últimos 7 dias",
      range: {
        from: new Date(new Date().setDate(new Date().getDate() - 6)),
        to: new Date(),
      },
    },
    {
      label: "Últimos 30 dias",
      range: {
        from: new Date(new Date().setDate(new Date().getDate() - 29)),
        to: new Date(),
      },
    },
  ]

  return (
    <div className="grid gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn("w-[300px] justify-start text-left font-normal", !from && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {from ? (
              to ? (
                <>
                  {format(from, "dd/MM/yyyy", { locale: ptBR })} - {format(to, "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : (
                format(from, "dd/MM/yyyy", { locale: ptBR })
              )
            ) : (
              <span>Selecione o período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            <div className="flex flex-col gap-2 p-3 border-r">
              {presetRanges.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  className="justify-start"
                  onClick={() => handleSelect(preset.range)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={from}
              selected={{ from, to }}
              onSelect={handleSelect}
              numberOfMonths={2}
              locale={ptBR}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
