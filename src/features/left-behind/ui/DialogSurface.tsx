// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import * as Dialog from '@radix-ui/react-dialog';
import { DialogOverlay } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/** One backdrop and one glass surface for every Left Behind modal view. */
export function LeftBehindDialogOverlay({ className, ...props }: Dialog.DialogOverlayProps) {
  return <DialogOverlay
    data-lb-dialog-overlay
    className={cn('z-[10020]', className)}
    {...props}
  />;
}

export function LeftBehindDialogContent({ className, ...props }: Dialog.DialogContentProps) {
  return <Dialog.Content
    className={cn('paledot dark pd-card fixed z-[10021] bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-2 right-2 flex max-h-[calc(100dvh-2.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex-col overflow-hidden rounded-lg border border-border bg-card/90 backdrop-blur-md motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200 sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:max-h-[calc(100dvh-4.5rem)] sm:w-[560px] sm:max-w-[calc(100vw-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:slide-in-from-bottom-0', className)}
    {...props}
  />;
}
