import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, onBlur, ...props }, ref) => {
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (onBlur) {
        onBlur(e);
      }
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-input border-[#02020238] bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#02020238] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        onBlur={handleBlur}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
