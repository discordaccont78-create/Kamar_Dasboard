import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "../../lib/utils"

// Fix: Using any for props and internal primitives to resolve intrinsic property type errors (className, children) in the current environment
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  any
>(({ className, ...props }, ref) => {
  const Root = SliderPrimitive.Root as any;
  const Track = SliderPrimitive.Track as any;
  const Range = SliderPrimitive.Range as any;
  const Thumb = SliderPrimitive.Thumb as any;

  return (
    <Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      {...props}
    >
      <Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary/20">
        <Range className="absolute h-full bg-primary" />
      </Track>
      <Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110 duration-100" />
    </Root>
  );
})
Slider.displayName = (SliderPrimitive.Root as any).displayName

export { Slider }