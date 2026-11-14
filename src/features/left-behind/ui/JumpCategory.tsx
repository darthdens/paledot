// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function JumpCategory({ title, expanded, onToggle, children }: {
  title: string; expanded: boolean; onToggle: () => void; children: ReactNode;
}) {
  return <div className="mb-1">
    <Button variant="ghost" aria-expanded={expanded} onClick={onToggle}
      className="w-full h-auto min-h-8 max-sm:min-h-11 justify-between p-1.5 sm:p-2 rounded-[4px] text-foreground hover:bg-accent/60">
      <span className="text-xs sm:text-sm font-medium">{title}</span>
      <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
    </Button>
    <div className={`grid transition-all duration-300 ease-out ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`} inert={!expanded}>
      <div className="overflow-hidden"><div className="ml-2 sm:ml-3 mt-0.5 space-y-0.5 border-l border-border pl-2">{children}</div></div>
    </div>
  </div>;
}