import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(
  (
    {
      className,
      orientation = "horizontal",
      onPointerDown,
      onPointerMove,
      onPointerUp,
      ...props
    },
    ref
  ) => (
    <SliderPrimitive.Root
      ref={ref}
      orientation={orientation}
      {...props}
      onPointerDown={(e) => {
        onPointerDown?.(e);
      }}
      onPointerMove={(e) => {
        onPointerMove?.(e);
      }}
      onPointerUp={(e) => {
        onPointerUp?.(e);
      }}
      className={cn(
        "relative flex touch-none select-none",
        orientation === "horizontal" ? "w-full items-center" : "h-full flex-col items-center",
        className
      )}
    >
      <SliderPrimitive.Track
        className={cn(
          "relative grow overflow-hidden rounded-full bg-border pointer-events-auto",
          orientation === "horizontal" ? "h-2 w-full" : "w-2 h-full"
        )}
      >
        <SliderPrimitive.Range
          className={cn(
            "absolute bg-secondary",
            orientation === "horizontal" ? "h-full" : "w-full"
          )}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-secondary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing relative z-50 pointer-events-auto" />
    </SliderPrimitive.Root>
  )
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
