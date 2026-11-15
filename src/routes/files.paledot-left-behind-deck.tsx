// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { createFileRoute } from '@tanstack/react-router';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import deck from '@/assets/documents/paledot-left-behind-deck.pdf.asset.json';

export const Route = createFileRoute('/files/paledot-left-behind-deck')({
  head: () => ({ meta: [
    { title: 'Left Behind presentation | Pale Dot' },
    { name: 'description', content: 'The Pale Dot: Left Behind presentation for NASA Space Apps Challenge 2026.' },
    { property: 'og:title', content: 'Left Behind presentation | Pale Dot' },
    { property: 'og:description', content: 'The Pale Dot: Left Behind presentation for NASA Space Apps Challenge 2026.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: DeckViewer,
});

function DeckViewer() {
  const { language } = useLanguage();
  const copy = {
    en: ['Left Behind', 'Back', 'Download PDF', 'Open PDF'],
    fr: ['Left Behind', 'Retour', 'Télécharger le PDF', 'Ouvrir le PDF'],
    es: ['Left Behind', 'Volver', 'Descargar PDF', 'Abrir PDF'],
    pt: ['Left Behind', 'Voltar', 'Descarregar PDF', 'Abrir PDF'],
    it: ['Left Behind', 'Indietro', 'Scarica PDF', 'Apri PDF'],
    de: ['Left Behind', 'Zurück', 'PDF herunterladen', 'PDF öffnen'],
  }[language];
  return <main className="fixed inset-0 z-[10000] grid grid-rows-[auto_minmax(0,1fr)] bg-background text-foreground">
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border px-2 py-2 pt-[max(8px,env(safe-area-inset-top))]">
      <div className="flex min-w-0 items-center gap-2"><Button asChild variant="ghost" size="icon" className="min-h-11 min-w-11 shrink-0" title={copy[1]}><a href={`/?site=${new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search).get('site') ?? 'paledot'}`} aria-label={copy[1]}><ArrowLeft /></a></Button><h1 className="truncate text-sm font-medium">Pale Dot · {copy[0]}</h1></div>
      <div className="flex shrink-0 gap-1"><Button asChild variant="outline" size="icon" className="min-h-11 min-w-11" title={copy[3]}><a href={deck.url} target="_blank" rel="noopener noreferrer" aria-label={copy[3]}><ExternalLink /></a></Button><Button asChild variant="outline" size="icon" className="min-h-11 min-w-11" title={copy[2]}><a href={deck.url} download="paledot-left-behind-deck.pdf" aria-label={copy[2]}><Download /></a></Button></div>
    </header>
    <iframe src={deck.url} title="Pale Dot · Left Behind" className="h-full w-full border-0 bg-background" />
  </main>;
}