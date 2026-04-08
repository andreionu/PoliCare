import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  iconOnly?: boolean
  size?: "sm" | "md" | "lg" | "xl"
}

export function Logo({ className, iconOnly = false, size = "md" }: LogoProps) {
  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("relative flex items-center justify-center shrink-0", iconSizes[size])}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Circular P Icon based on the new provided image */}
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="#206070"
            strokeWidth="12"
            fill="none"
          />
          <path
            d="M42 30V70 M42 30H58C68 30 68 45 58 45H42"
            stroke="#206070"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {!iconOnly && (
        <div
          className={cn(
            "font-extrabold tracking-tight flex items-baseline transition-all",
            size === "sm" && "text-xl",
            size === "md" && "text-2xl",
            size === "lg" && "text-4xl",
            size === "xl" && "text-5xl"
          )}
        >
          <span className="text-[#206070] dark:text-slate-200">Poli</span>
          <span className="text-[#40A0D0]">Care</span>
        </div>
      )}
    </div>
  )
}
