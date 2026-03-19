
"use client"

import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon, ArrowRight } from "lucide-react"
import { DateRange, SelectRangeEventHandler } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps extends React.ComponentProps<"div"> {
  date?: DateRange
  onSelect: (date: DateRange | undefined) => void
}

export function DateRangePicker({
  className,
  date,
  onSelect,
}: DateRangePickerProps) {
  
  const handleSelect: SelectRangeEventHandler = (range, selectedDay) => {
    if (date?.from && date?.to) {
      onSelect({ from: selectedDay, to: undefined });
    } else {
      onSelect(range);
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal h-10 px-2 bg-background border-primary/20 hover:border-primary/40 transition-all",
              !date?.from && "text-muted-foreground",
              date?.from && "border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500/20 shadow-sm"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-emerald-600" />
            {date?.from ? (
              <div className="flex items-center gap-1.5 overflow-hidden w-full text-foreground">
                <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase shrink-0 shadow-md">INÍCIO</span>
                <span className="font-bold text-xs tracking-tight">
                  {format(date.from, "dd/MM/yy", { locale: ptBR })}
                </span>
                {date.to ? (
                  <>
                    <ArrowRight className="h-3 w-3 text-emerald-600 shrink-0 mx-0.5" />
                    <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase shrink-0 shadow-md">FIM</span>
                    <span className="font-bold text-xs tracking-tight">
                      {format(date.to, "dd/MM/yy", { locale: ptBR })}
                    </span>
                  </>
                ) : (
                  <span className="text-emerald-600/50 text-[10px] italic ml-1 animate-pulse font-medium">selecione o fim...</span>
                )}
              </div>
            ) : (
              <span className="text-xs font-medium">Selecionar período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-emerald-500/10 shadow-2xl" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
