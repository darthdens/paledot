// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useSyncExternalStore } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { downloadStore, type DownloadProgress } from '../data/download';
const empty: ReadonlyArray<DownloadProgress> = [];
export function DownloadStatus() {
  const rows = useSyncExternalStore(downloadStore.subscribe, downloadStore.snapshot, () => empty);
  const { tr, numberLocale } = useLanguage();
  if (!rows.length) return null;
  const loaded = rows.reduce((sum, row) => sum + row.loaded, 0);
  const total = rows.every(row => row.total !== null) ? rows.reduce((sum, row) => sum + (row.total ?? 0), 0) : null;
  const label = tr({ en: 'Downloading', fr: 'Téléchargement', es: 'Descargando', pt: 'A descarregar', it: 'Download in corso', de: 'Wird heruntergeladen' });
  const value = total ? `${Math.min(100, Math.round(loaded / total * 100))}%` : `${Math.round(loaded / 1000).toLocaleString(numberLocale)} kB`;
  return <div data-download-status className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[10050] pointer-events-none border border-border rounded-md bg-background px-3 py-2 text-xs text-foreground font-mono tabular-nums" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={total ? Math.min(100, Math.round(loaded / total * 100)) : undefined} aria-valuetext={`${label} ${value}`}>{label} · {value}</div>;
}