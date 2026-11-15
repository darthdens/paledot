// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCosmosStore } from '@/components/cosmos/store/useCosmosStore';
import credits from '../../../../CREDITS.md?raw';
import { useLeftBehindStore } from '../state/useLeftBehindStore';
import { useSignal } from '../state/useSignal';
import { useSimClock } from '../state/useSimClock';
import { getHardware, getTrajectory } from '../data/dataClient';
import { loadTrajectory } from '../engine/trajectory';
import { followHardware } from '../lib/hardwareNavigation';
import { framingCopy } from '../lib/framingCopy';
import { cardCopy, placeNames } from '../lib/cardCopy';
import { dataText } from '../lib/dataText';
import { buildSignalRace } from '../lib/signal';
import { machineVisit } from '../lib/framing';
import { glossaryData } from '../lib/glossaryData';
import type { CardMachine } from './MachineCard';
import type { Trajectory } from '../data/types';

export async function visitMachine(machine: CardMachine) {
  const visit = machineVisit(machine, useSimClock.getState().simDate);
  useCosmosStore.getState().stopTour();
  useSimClock.getState().setSimDate(visit.date);
  useLeftBehindStore.setState({ framingView: null, machinesVisible: true, menuOpen: false });
  await loadTrajectory(visit.target);
  followHardware(visit.target);
}
export function FramingViews() {
  const { language, tr, numberLocale } = useLanguage();
  const c = framingCopy[language], card = cardCopy[language];
  const T = (value: string) => tr({ en: value, fr: value });
  const view = useLeftBehindStore(s => s.framingView);
  const [machines, setMachines] = useState<CardMachine[]>([]);
  const [tracks, setTracks] = useState<Trajectory[]>([]);
  const [ordered, setOrdered] = useState<string[]>([]);
  const [distances, setDistances] = useState<Record<string, number>>({});
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!view) return;
    let alive = true;
    setFailed(false);
    void getHardware().then(async h => {
      const ms = h.machines as CardMachine[];
      const all = await Promise.all(ms.flatMap(m => m.trajectories.map(t => getTrajectory(t.id))));
      const race = buildSignalRace(ms, all, Date.now(), '');
      if (!alive) return;
      setMachines(ms); setTracks(all); setOrdered(race.rows.map(r => r.id));
      setDistances(Object.fromEntries(race.rows.map(r => [r.id, r.distanceKm])));
    }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [view]);
  const close = () => useLeftBehindStore.setState({ framingView: null, menuOpen: view === 'intro' });
  const start = () => { useLeftBehindStore.setState({ framingView: null, menuOpen: false }); useCosmosStore.getState().setShowControlHints(false); useCosmosStore.getState().startTour('apollo-11'); };
  const signal = () => { useLeftBehindStore.setState({ framingView: null, menuOpen: false }); useSignal.getState().show(); };
  const status = (m: CardMachine) => m.status?.type === 'in-use' ? card.stillInUse : m.status?.type === 'transmitting' ? card.stillTransmitting : m.id === 'lunar-rovers' ? c.visible : m.status?.text ? dataText(m.status.text, language) : c.silent;
  const heading = view === 'intro' ? c.heading : view === 'machines' ? c.machines : view === 'summary' ? c.summary : c.know;
  const list = (summary = false) => <ul className="divide-y divide-border">
    {(summary ? machines : ordered.map(id => machines.find(m => m.id === id)).filter((m): m is CardMachine => !!m)).map(m => <li key={m.id} className="py-3">
      {summary ? <p className="text-sm leading-relaxed">{dataText(m.name, language)}<span className="block mt-1 text-xs text-muted-foreground">{status(m)}</span></p> : <Button variant="ghost" className="grid h-auto min-h-11 w-full grid-cols-[minmax(0,1fr)] justify-start gap-2 whitespace-normal px-0 py-1 text-left font-normal" onClick={() => { void visitMachine(m).catch(() => setFailed(true)); }}>
        <span className="min-w-0 text-sm">{dataText(m.name, language)}</span>
        <span className="min-w-0 text-xs text-muted-foreground">{new Date(m.landingDate ?? m.launchDate).getUTCFullYear()} · {m.place ? placeNames[m.place]?.[language] ?? dataText(m.place, language) : 'TODO(source)'}<span className="block mt-1">{T(c.distance)} · {Math.round(distances[m.id] ?? 0).toLocaleString(numberLocale)} km</span></span>
        <span className="justify-self-start rounded-full border border-border px-2 py-1 text-[10px] text-muted-foreground">{status(m)}</span>
      </Button>}
    </li>)}
  </ul>;
  return <Dialog.Root open={!!view} onOpenChange={open => { if (!open) close(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className={`fixed inset-0 z-[10020] ${view === 'summary' ? 'bg-background motion-safe:animate-in motion-safe:fade-in motion-safe:duration-1000' : 'bg-background/20'}`} />
      <Dialog.Content data-lb-framing={view} className={`paledot dark pd-card fixed z-[10021] left-2 right-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] max-h-[calc(100dvh-2.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex flex-col overflow-hidden rounded-lg border border-border bg-card/80 backdrop-blur-md sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:right-auto sm:w-[560px] sm:max-w-[calc(100vw-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 ${view === 'summary' ? 'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-1000' : ''}`}>
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border p-2">
          <Dialog.Title className="min-w-0 pl-2 text-base font-semibold">{T(heading)}</Dialog.Title>
          <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0 text-muted-foreground" aria-label={T(c.close)} onClick={close}><X className="h-4 w-4" /></Button>
        </header>
        <div className="overflow-y-auto overscroll-contain p-4 space-y-5">
          <Dialog.Description className={view === 'intro' ? 'text-sm leading-relaxed text-foreground' : 'sr-only'}>{T(view === 'intro' ? c.intro : heading)}</Dialog.Description>
          {failed && <p role="alert" className="text-xs text-muted-foreground">{T(c.unavailable)}</p>}
          {view === 'intro' && <div className="grid gap-2">
            <Button variant="outline" className="pd-pill h-auto min-h-11 whitespace-normal" onClick={start}>{T(c.moon)}</Button>
            <Button variant="outline" className="pd-pill h-auto min-h-11 whitespace-normal" onClick={() => useLeftBehindStore.getState().openFraming('machines')}>{T(c.choose)}</Button>
            <Button variant="outline" className="pd-pill h-auto min-h-11 whitespace-normal" onClick={signal}>{T(c.signal)}</Button>
            <Button variant="ghost" className="min-h-11 text-muted-foreground" onClick={close}>{T(c.skip)}</Button>
          </div>}
          {view === 'machines' && list()}
          {view === 'summary' && <>{list(true)}<p className="text-xs text-muted-foreground">{T(c.statusNote)}</p><div className="grid gap-2"><Button variant="outline" className="pd-pill h-auto min-h-11" onClick={start}>{T(c.again)}</Button><Button variant="outline" className="pd-pill h-auto min-h-11" onClick={signal}>{T(c.signal)}</Button><Button variant="ghost" className="min-h-11" onClick={close}>{T(c.explore)}</Button></div></>}
          {view === 'knowledge' && <>
            <section id="lb-how-we-know" className="space-y-3 text-xs leading-relaxed text-muted-foreground">{[c.calculated, c.reported, c.simplified, c.scale, c.disclosure, c.ai].map(line => <p key={line}>{T(line)}</p>)}</section>
            <section className="space-y-3 text-xs leading-relaxed"><h3 className="text-sm font-semibold">{T(c.sources)}</h3>
              <a className="block underline underline-offset-4" href="https://ssd-api.jpl.nasa.gov/doc/horizons.html" target="_blank" rel="noopener noreferrer">JPL Horizons API</a>
              <a className="block underline underline-offset-4" href="https://images.nasa.gov" target="_blank" rel="noopener noreferrer">NASA Image and Video Library API</a>
              <p className="text-muted-foreground">{T(c.photoDate)}</p>
              <ul className="space-y-2 text-muted-foreground">{tracks.map(t => <li key={t.id}>{t.id} · {T(c.retrieved)}: {t.retrievedAt ?? 'TODO(source)'}{t.source === 'simplified' && <span className="block">{T(c.simplified)}</span>}</li>)}</ul>
              {machines.map(m => <div key={m.id}><h4 className="font-medium">{dataText(m.name, language)}</h4><ul>{m.sources?.map(s => <li key={s.url}><a className="text-muted-foreground underline underline-offset-4" href={s.url} target="_blank" rel="noopener noreferrer">{dataText(s.title, language)}</a></li>)}</ul></div>)}
            </section>
            <section className="space-y-3"><h3 className="text-sm font-semibold">{T(c.teachers)}</h3><ul className="list-disc pl-4 space-y-3 text-xs leading-relaxed text-muted-foreground">{[c.qScale, c.qCommunication, c.qLegacy].map(q => <li key={q}>{T(q)}</li>)}</ul><a className="text-xs underline underline-offset-4" href="#lb-how-we-know" onClick={e => { e.preventDefault(); document.getElementById('lb-how-we-know')?.scrollIntoView({ behavior: 'instant', block: 'start' }); }}>{T(c.know)}</a></section>
            <section className="space-y-3"><h3 className="text-sm font-semibold">{T(c.glossary)}</h3><dl className="space-y-3 text-xs leading-relaxed">{glossaryData.map(g => <div key={g.id}><dt className="font-medium">{T(g.terms[language])}</dt><dd className="mt-1 text-muted-foreground">{T(g.definitions[language])}</dd></div>)}</dl></section>
            <section className="space-y-3"><h3 className="text-sm font-semibold">{T(c.credits)}</h3><div className="whitespace-pre-wrap break-words text-xs leading-relaxed text-muted-foreground">{credits.replace(/^<!--.*?-->\s*/s, '')}</div></section>
          </>}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}