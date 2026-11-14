// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { Play, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { tourOptions } from '../lib/tourOptions';
export function TourChoices({ onBegin }: { onBegin: () => void }) {
  const { language } = useLanguage();
  return <div className="space-y-1 text-left">
    {tourOptions.map(option => <Button key={option.id} variant="ghost" disabled={!option.available} onClick={option.available ? onBegin : undefined} className="w-full min-h-11 justify-between gap-3 px-3 text-sm text-foreground hover:bg-foreground/10">
      <span className="min-w-0 whitespace-normal">{(option.label as Record<string, string>)[language] ?? option.label.en}</span>
      {option.available ? <Play className="h-4 w-4 shrink-0" /> : <LockKeyhole className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
    </Button>)}
  </div>;
}