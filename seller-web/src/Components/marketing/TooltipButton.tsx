import { useEffect, useId, useRef, useState } from "react"

type TooltipButtonProps = {
  content: string
  ariaLabel: string
}

export default function TooltipButton({ content, ariaLabel }: TooltipButtonProps) {
  const [open, setOpen] = useState(false)
  const tooltipId = useId()
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (!containerRef.current) return
      if (containerRef.current.contains(target)) return
      setOpen(false)
    }

    document.addEventListener("mousedown", onPointerDown, true)
    document.addEventListener("touchstart", onPointerDown, true)
    return () => {
      document.removeEventListener("mousedown", onPointerDown, true)
      document.removeEventListener("touchstart", onPointerDown, true)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        className="h-6 w-6 rounded-full border border-[#98A2B3] bg-white flex items-center justify-center text-[#98A2B3] hover:text-[#667085] hover:border-[#D0D5DD] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0BB248]/30"
        onClick={(e) => {
          e.preventDefault()
          setOpen((v) => !v)
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false)
            ;(e.currentTarget as HTMLButtonElement).blur()
          }
        }}
      >
        <span aria-hidden className="text-xs font-semibold leading-none">
          ?
        </span>
      </button>
      {open ? (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute bottom-full right-0 mb-2 w-max max-w-[220px] rounded-lg border border-white/20 bg-white/80 backdrop-blur-sm px-4 py-2 text-xs text-neutral-800 shadow-lg"
        >
          {content}
        </div>
      ) : null}
    </div>
  )
}

