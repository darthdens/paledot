// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ObjectPanelHeader({ title, minimized, onToggle, onClose, closeLabel }: {
  title: string; minimized: boolean; onToggle: () => void; onClose: () => void; closeLabel: string;
}) {
  return <div className="flex items-center gap-1 p-3">
    <Button variant="ghost" onClick={onToggle} aria-expanded={!minimized}
      className="min-w-0 flex-1 h-11 justify-between rounded-[4px] px-0 text-foreground hover:bg-accent/40">
      <span className="truncate text-sm sm:text-base font-semibold">{title}</span>
      {minimized ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
    </Button>
    <Button size="icon" variant="ghost" onClick={onClose} aria-label={closeLabel}
      className="h-11 w-11 shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent/60"><X className="h-4 w-4" /></Button>
  </div>;
}