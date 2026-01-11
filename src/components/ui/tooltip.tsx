import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

interface TooltipContentProps extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
  variant?: "default" | "dark";
}

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(({ className, sideOffset = 4, variant = "default", ...props }, ref) => {
  const [portalContainer, setPortalContainer] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    const getFullscreenElement = () => {
      const doc = document as any;
      return (
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement ||
        null
      ) as HTMLElement | null;
    };

    const update = () => setPortalContainer(getFullscreenElement());
    update();

    document.addEventListener("fullscreenchange", update);
    document.addEventListener("webkitfullscreenchange", update);
    document.addEventListener("mozfullscreenchange", update);

    return () => {
      document.removeEventListener("fullscreenchange", update);
      document.removeEventListener("webkitfullscreenchange", update);
      document.removeEventListener("mozfullscreenchange", update);
    };
  }, []);

  return (
    <TooltipPrimitive.Portal container={portalContainer ?? undefined}>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        avoidCollisions={true}
        collisionPadding={16}
        collisionBoundary={portalContainer ?? undefined}
        sticky="partial"
        className={cn(
          "overflow-hidden max-w-[calc(100vw-2rem)] whitespace-normal break-words rounded-md px-3 py-1.5 text-sm shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          variant === "default" && "z-50 border bg-popover text-popover-foreground",
          variant === "dark" && "z-[2147483647] bg-white/10 text-white/90 border-0 backdrop-blur-sm",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
});
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
