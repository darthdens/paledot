// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { Play, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { tourOptions } from '../lib/tourOptions';
export function TourChoices({ onBegin }: { onBegin: () => void }) {
  const { language } = useLanguage();
  return <div className="space-y-0.5 text-left">
    {tourOptions.map(option => <Button key={option.id} variant="ghost" disabled={!option.available} onClick={option.available ? onBegin : undefined} className="w-full h-auto min-h-7 max-sm:min-h-11 justify-between gap-2 p-1.5 rounded-[4px] text-xs font-normal text-muted-foreground hover:text-foreground hover:bg-accent/60">
      <span className="min-w-0 whitespace-normal">{(option.label as Record<string, string>)[language] ?? option.label.en}</span>
      {option.available ? <Play className="h-3 w-3 shrink-0" /> : <LockKeyhole className="h-3 w-3 shrink-0 text-muted-foreground" />}
    </Button>)}
  </div>;
}