import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

export interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  variant?: "default" | "light";
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(
  (
    {
      className,
      orientation = "horizontal",
      variant = "default",
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
        "relative flex select-none",
        orientation === "horizontal" ? "w-full items-center" : "h-full flex-col items-center",
        className
      )}
    >
      <SliderPrimitive.Track
        className={cn(
          "relative grow overflow-hidden rounded-full pointer-events-auto",
          orientation === "horizontal" ? "h-2 w-full" : "w-4 sm:w-2 h-full",
          variant === "light" ? "bg-white/20" : "bg-border"
        )}
      >
        <SliderPrimitive.Range
          className={cn(
            "absolute",
            orientation === "horizontal" ? "h-full" : "w-full",
            variant === "light" ? "bg-white/60" : "bg-secondary"
          )}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb 
        className={cn(
          "block h-5 w-5 rounded-full border-2 ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing relative z-50 pointer-events-auto",
          variant === "light" ? "border-white bg-white" : "border-secondary bg-background"
        )}
      />
    </SliderPrimitive.Root>
  )
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
