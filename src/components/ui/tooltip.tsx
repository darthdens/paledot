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
  const [container, setContainer] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    if (variant !== "dark") return;

    const getContainer = () => {
      const doc = document as any;
      // In fullscreen, use the fullscreen element
      const fullscreenEl = (
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement ||
        null
      ) as HTMLElement | null;
      
      if (fullscreenEl) return fullscreenEl;
      
      // Otherwise use the cosmos container
      return document.querySelector('[data-cosmos-container]') as HTMLElement | null;
    };

    const update = () => setContainer(getContainer());
    update();

    document.addEventListener("fullscreenchange", update);
    document.addEventListener("webkitfullscreenchange", update);
    document.addEventListener("mozfullscreenchange", update);

    // Also observe DOM changes in case cosmos container mounts later
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("fullscreenchange", update);
      document.removeEventListener("webkitfullscreenchange", update);
      document.removeEventListener("mozfullscreenchange", update);
      observer.disconnect();
    };
  }, [variant]);

  // For dark variant, portal into the container and use it as collision boundary
  if (variant === "dark") {
    return (
      <TooltipPrimitive.Portal container={container ?? undefined}>
        <TooltipPrimitive.Content
          ref={ref}
          sideOffset={sideOffset}
          avoidCollisions={true}
          collisionPadding={16}
          collisionBoundary={container ?? undefined}
          sticky="partial"
          className={cn(
            "overflow-hidden max-w-[min(calc(100vw-2rem),280px)] whitespace-normal break-words rounded-md px-3 py-1.5 text-sm shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            "z-[2147483647] bg-white/10 text-white/90 border-0 backdrop-blur-xs",
            className,
          )}
          {...props}
        />
      </TooltipPrimitive.Portal>
    );
  }

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        avoidCollisions={true}
        collisionPadding={16}
        sticky="partial"
        className={cn(
          "overflow-hidden rounded-md px-3 py-1.5 text-sm shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          "z-50 border bg-popover text-popover-foreground",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
});
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
