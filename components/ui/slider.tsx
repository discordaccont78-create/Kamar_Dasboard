
import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "../../lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center group",
      className
    )}
    {...(props as any)}
  >
    {/* Track Background */}
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-sm bg-secondary/40 border border-white/5 shadow-inner">
      {/* Active Range (Fill) */}
      <SliderPrimitive.Range className="absolute h-full bg-primary/80 shadow-[0_0_10px_var(--primary)]" />
    </SliderPrimitive.Track>
    
    {/* Thumb (The Handle) - Changed to Rectangular Fader Style */}
    <SliderPrimitive.Thumb className="block h-5 w-2.5 rounded-[1px] border border-primary/50 bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-primary hover:border-primary shadow-[0_0_5px_rgba(0,0,0,0.5)] cursor-col-resize group-active:scale-110 duration-75 relative z-20">
        {/* Thumb Detail: Small grip line */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-2 bg-primary/50 group-hover:bg-black/50" />
    </SliderPrimitive.Thumb>
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
