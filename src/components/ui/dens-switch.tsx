import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

/**
 * DensSwitch
 * Styled to match the toggle used on brandkit.dens.so (checked/unchecked + light/dark)
 */
const DensSwitch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=unchecked]:bg-muted/40 data-[state=unchecked]:border-border/60 dark:data-[state=unchecked]:bg-muted/20 dark:data-[state=unchecked]:border-border/50 data-[state=checked]:bg-muted-foreground/60 data-[state=checked]:border-transparent dark:data-[state=checked]:bg-muted-foreground/50",
      className,
    )}
    {...props}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-card shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
      )}
    />
  </SwitchPrimitives.Root>
));
DensSwitch.displayName = "DensSwitch";

export { DensSwitch };
