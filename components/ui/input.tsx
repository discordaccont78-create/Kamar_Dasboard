
import * as React from "react"
import { cn } from "../../lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Layout & Base Styles
          "flex h-10 w-full rounded-md border border-white/10 bg-black/5 dark:bg-white/5 px-4 py-2 text-xs font-mono font-bold shadow-sm transition-all duration-300",
          
          // Typography
          "text-foreground",
          
          // Placeholder Styling (The 'Technical' Look)
          "placeholder:text-muted-foreground/40 placeholder:font-bold placeholder:uppercase placeholder:tracking-[0.15em] placeholder:text-[9px]",
          
          // Hover State
          "hover:border-primary/30 hover:bg-primary/5",
          
          // Focus State (Primary Glow)
          "focus-visible:outline-none focus-visible:border-primary focus-visible:bg-primary/10 focus-visible:shadow-[0_0_15px_-3px_rgba(var(--primary),0.15)]",
          
          // Disabled State
          "disabled:cursor-not-allowed disabled:opacity-50",
          
          // File Input specifics
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
