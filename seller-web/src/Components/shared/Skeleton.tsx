import { cn } from "@/lib/utilsV2"

/**
 * Skeleton Component
 * 
 * Loading skeleton with continuous shimmer animation effect.
 * Creates multiple light waves sweeping from left to right for smooth loading indication.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden bg-gray-200 rounded-md",
        "before:absolute before:inset-0",
        "before:-translate-x-full",
        "before:animate-[shimmer_1.5s_infinite]",
        "before:bg-gradient-to-r",
        "before:from-transparent before:via-white/70 before:to-transparent",
        "before:w-[200%]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
