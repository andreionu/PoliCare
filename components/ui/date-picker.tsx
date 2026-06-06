"use client"

import * as React from "react"
import { format, parseISO } from "date-fns"
import { ro } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  min?: string
  max?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Selectează data",
  className,
  disabled,
  min,
  max,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const selected = value ? parseISO(value) : undefined

  const disabledMatcher = React.useMemo(() => {
    const m: ({ before: Date } | { after: Date })[] = []
    if (min) m.push({ before: parseISO(min) })
    if (max) m.push({ after: parseISO(max) })
    return m.length ? m : undefined
  }, [min, max])

  function handleSelect(date: Date | undefined) {
    onChange?.(date ? format(date, "yyyy-MM-dd") : "")
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "justify-start text-left font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {selected ? format(selected, "d MMMM yyyy", { locale: ro }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={ro}
          selected={selected}
          onSelect={handleSelect}
          disabled={disabledMatcher}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
