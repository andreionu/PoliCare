"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Eraser } from "lucide-react"

interface SignaturePadProps {
  value: string          // base64 PNG
  onChange: (v: string) => void
}

export function SignaturePad({ value, onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [isEmpty, setIsEmpty] = useState(!value)

  // Draw saved signature on mount / when value set externally
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (value) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0)
      img.src = value
      setIsEmpty(false)
    } else {
      setIsEmpty(true)
    }
  }, []) // only on mount — controlled updates go through drawing

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    drawing.current = true
  }, [])

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return
    e.preventDefault()
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!
    ctx.strokeStyle = "#1e293b"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }, [])

  const endDraw = useCallback(() => {
    if (!drawing.current) return
    drawing.current = false
    const canvas = canvasRef.current!
    const data = canvas.toDataURL("image/png")
    setIsEmpty(false)
    onChange(data)
  }, [onChange])

  const clear = () => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
    onChange("")
  }

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl border border-dashed border-slate-300 bg-slate-50 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={600}
          height={150}
          className="w-full h-[120px] cursor-crosshair touch-none"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {isEmpty && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-slate-400 pointer-events-none select-none">
            Semnați aici
          </p>
        )}
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clear}
          disabled={isEmpty}
          className="rounded-xl h-7 gap-1.5 text-xs text-slate-500"
        >
          <Eraser className="h-3.5 w-3.5" />
          Șterge semnătura
        </Button>
      </div>
    </div>
  )
}
