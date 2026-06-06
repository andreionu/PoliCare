"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

interface PaginationProps {
  page: number
  pageCount: number
  total: number
  pageSize: number
  loading?: boolean
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  className?: string
}

export function Pagination({ page, pageCount, total, pageSize, loading, onPageChange, onPageSizeChange, className }: PaginationProps) {
  if (total === 0) return null

  const from = Math.min((page - 1) * pageSize + 1, total)
  const to = Math.min(page * pageSize, total)

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1)
    .reduce<(number | "…")[]>((acc, p, i, arr) => {
      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…")
      acc.push(p)
      return acc
    }, [])

  return (
    <div className={cn("px-6 py-4 border-t border-slate-100 dark:border-slate-700/40 bg-slate-50/50 dark:bg-slate-800/30 flex flex-wrap items-center justify-between gap-3", className)}>
      <div className="flex items-center gap-3">
        <p className="text-xs text-muted-foreground font-medium">
          {from}–{to} din {total} înregistrări
        </p>
        {onPageSizeChange && (
          <Select value={String(pageSize)} onValueChange={(v) => { onPageSizeChange(Number(v)); onPageChange(1) }}>
            <SelectTrigger className="h-7 w-[90px] text-xs rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((s) => (
                <SelectItem key={s} value={String(s)} className="text-xs">{s} / pagină</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-700" disabled={page <= 1 || loading} onClick={() => onPageChange(1)}>
            <ChevronLeft className="h-3.5 w-3.5" /><ChevronLeft className="h-3.5 w-3.5 -ml-2.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-700" disabled={page <= 1 || loading} onClick={() => onPageChange(page - 1)}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`e${i}`} className="w-8 text-center text-xs text-muted-foreground">…</span>
            ) : (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="icon"
                className={`h-8 w-8 rounded-lg text-xs font-bold ${p === page ? "bg-primary text-white border-primary shadow-sm" : "border-slate-200 dark:border-slate-700"}`}
                disabled={loading}
                onClick={() => onPageChange(p as number)}
              >
                {p}
              </Button>
            )
          )}
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-700" disabled={page >= pageCount || loading} onClick={() => onPageChange(page + 1)}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-700" disabled={page >= pageCount || loading} onClick={() => onPageChange(pageCount)}>
            <ChevronRight className="h-3.5 w-3.5" /><ChevronRight className="h-3.5 w-3.5 -ml-2.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
