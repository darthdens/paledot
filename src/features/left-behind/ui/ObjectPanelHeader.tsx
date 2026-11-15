// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ObjectPanelHeader({ title, minimized, onToggle, onClose, closeLabel }: {
  title: string; minimized: boolean; onToggle: () => void; onClose: () => void; closeLabel: string;
}) {
  // The whole header strip (the entire card when collapsed) takes the hover colour.
  return <div className="relative flex items-center transition-colors hover:bg-accent/40">
    <Button variant="ghost" onClick={onToggle} aria-expanded={!minimized}
      className="min-w-0 flex-1 h-auto min-h-[68px] justify-between gap-2 rounded-none py-3 pl-3 pr-[60px] text-foreground hover:bg-transparent">
      <span className="truncate text-sm sm:text-base font-semibold">{title}</span>
      {minimized ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
    </Button>
    <Button size="icon" variant="ghost" onClick={onClose} aria-label={closeLabel}
      className="absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent/60"><X className="h-4 w-4" /></Button>
  </div>;
}