// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Compass, ExternalLink, Map } from 'lucide-react';
import type { Machine, Photo } from '../data/types';
import { getPhotoManifest } from '../data/dataClient';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useLanguage } from '@/i18n/LanguageContext';
import { cardCopy, placeNames } from '../lib/cardCopy';
import { machineKinds } from '../lib/machineCopy';
import { helioPositionKm, moonPositionKm } from '../engine/ephemeris';
import { measurementsAt } from '../engine/trajectory';
import { useSimClock } from '../state/useSimClock';
import { useLeftBehindStore } from '../state/useLeftBehindStore';

export type CardMachine = Machine & {
  place?: string; status?: { type: string; since: string | null };
  keyDates?: { label: string; date: string; factId?: string }[]; leftBehind?: string[]; whereNow?: string;
  facts?: { id: string; text: string; sourceUrl: string }[]; sources?: { title: string; url: string }[];
};
type ManifestPhoto = Omit<Photo, 'caption'> & { caption: string | Record<string, string> };

// Pale Blue Dot material belongs only to Voyager 1's One Last Look tour step.
const PALE_BLUE = /pale[- ]blue[- ]dot|sagan/i;

function PhotoBox({ photo, caption, onOpen, label, missing }: { photo: ManifestPhoto; caption: string; onOpen: () => void; label: string; missing: string }) {
  const [failed, setFailed] = useState(false);
  return <figure className="space-y-1.5">
    <button type="button" onClick={onOpen} disabled={failed} aria-label={`${label}: ${photo.alt}`} className="pd-photo-box block w-full aspect-[4/3] overflow-hidden rounded-[6px] border border-border bg-muted/40">
      {failed ? <span className="grid h-full place-items-center text-xs text-muted-foreground">{missing}</span>
        : <img src={photo.imageUrl} alt={photo.alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className="h-full w-full object-cover" />}
    </button>
    <figcaption className="text-xs text-foreground">{caption}<span className="block pd-photo-credit text-muted-foreground">{photo.credit} · {photo.nasaId}</span></figcaption>
  </figure>;
}

export function MachineCard({ machine }: { machine: CardMachine }) {
  const { language, numberLocale } = useLanguage();
  const t = cardCopy[language];
  const [photos, setPhotos] = useState<ManifestPhoto[] | null>(null);
  const [open, setOpen] = useState<ManifestPhoto | null>(null);
  useEffect(() => { let live = true; void getPhotoManifest().then(list => { if (live) setPhotos((list as ManifestPhoto[]).filter(p => p.machineId === machine.id && !PALE_BLUE.test(p.role ?? ''))); }).catch(() => live && setPhotos([])); return () => { live = false; }; }, [machine.id]);
  const capt = (p: ManifestPhoto) => typeof p.caption === 'string' ? p.caption : (p.caption[language] ?? p.caption.en ?? p.title);

  const year = new Date(machine.landingDate ?? machine.launchDate).getUTCFullYear();
  const kind = machine.kind ? machineKinds[machine.kind]?.[language] ?? machine.kind : '';
  const place = machine.place ? placeNames[machine.place]?.[language] ?? machine.place : '';
  const status = machine.status;
  const statusText = status?.type === 'in-use' ? t.stillInUse : status?.type === 'transmitting' ? t.stillTransmitting
    : status?.since ? t.silentSince.replace('{d}', new Date(`${status.since}-01T00:00:00Z`).toLocaleDateString(numberLocale, { month: 'long', year: 'numeric', timeZone: 'UTC' })) : null;
  const dateFacts = new Set((machine.keyDates ?? []).map(d => d.factId));
  const did = (machine.facts ?? []).filter(f => !dateFacts.has(f.id) && !PALE_BLUE.test(f.text)).slice(0, 3);

  // Distance from Earth for today's real date (not the simulation date).
  const distance = useMemo(() => {
    const now = new Date();
    const earth = helioPositionKm('earth', now);
    const at = machine.body === 'moon' ? moonPositionKm(now) : machine.body === 'mars' ? helioPositionKm('mars', now) : null;
    if (at) return Math.hypot(...at.map((v, i) => v - (earth[i] ?? 0)));
    return measurementsAt(machine.trajectories[0]?.id ?? machine.id, now)?.earthKm ?? null;
  }, [machine]);
  const fmtDate = (d: string) => new Date(`${d.slice(0, 10)}T00:00:00Z`).toLocaleDateString(numberLocale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const heading = 'pd-hud-label';

  return <div className="space-y-4" data-machine-card>
    <div className="space-y-1.5">
      <p className={heading}>{[kind, place, year].filter(Boolean).join(' · ')}</p>
      <h3 className="text-base font-semibold text-foreground">{machine.name}</h3>
      {statusText && <span className="inline-flex rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground" data-machine-status>{statusText}</span>}
    </div>

    <section aria-label={t.photos}>
      {photos === null ? <div className="aspect-[4/3] rounded-[6px] border border-border bg-muted/40" />
        : photos.length === 0 ? <p className="text-xs text-muted-foreground">TODO(source)</p>
        : <Carousel opts={{ align: 'start' }}><CarouselContent className="-ml-2">{photos.map(p => <CarouselItem key={p.id} className="pl-2 basis-[85%]"><PhotoBox photo={p} caption={capt(p)} onOpen={() => setOpen(p)} label={t.openPhoto} missing={t.photoUnavailable} /></CarouselItem>)}</CarouselContent></Carousel>}
      {photos && photos.length === 1 && <p className="mt-1 text-xs text-muted-foreground">TODO(source)</p>}
    </section>

    {did.length > 0 && <section className="space-y-1.5"><h4 className={heading}>{t.whatItDid}</h4><ul className="list-disc space-y-1 pl-4 text-sm text-foreground">{did.map(f => <li key={f.id}>{f.text}</li>)}</ul></section>}
    {machine.leftBehind?.length ? <section className="space-y-1.5"><h4 className={heading}>{t.leftBehind}</h4><ul className="list-disc space-y-1 pl-4 text-sm text-foreground">{machine.leftBehind.map(x => <li key={x}>{x}</li>)}</ul></section> : null}
    <section className="space-y-1.5"><h4 className={heading}>{t.whereNow}</h4>
      <p className="text-sm text-foreground">{machine.whereNow ?? 'TODO(source)'}</p>
      {distance !== null && <p className="pd-hud-value text-xs">{t.distanceToday}: {Math.round(distance).toLocaleString(numberLocale)} km <span className="text-muted-foreground">· {t.calculated}</span></p>}
    </section>
    {machine.keyDates?.length ? <section className="space-y-1.5"><h4 className={heading}>{t.keyDates}</h4>
      <dl className="space-y-1 font-mono text-xs tabular-nums">{machine.keyDates.map(d => <div key={d.label + d.date} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2"><dt className="text-foreground">{d.label}</dt><dd className="text-right text-foreground">{fmtDate(d.date)}<span className="block text-[10px] text-muted-foreground">{d.factId ? t.nasaReported : 'TODO(source)'}</span></dd></div>)}</dl>
    </section> : null}
    {machine.sources?.length ? <section className="space-y-1.5"><h4 className={heading}>{t.sources}</h4><ul className="space-y-1 text-xs">{machine.sources.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1 text-foreground underline-offset-2 hover:underline">{s.title}<ExternalLink className="mt-0.5 h-3 w-3 shrink-0" aria-hidden /></a></li>)}</ul></section> : null}

    <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
      <Button size="sm" variant="ghost" disabled className="text-xs bg-muted/50 text-foreground max-sm:min-h-11 whitespace-normal h-auto py-1.5"><Map className="w-3 h-3" />{t.takeTour}</Button>
      <Button size="sm" variant="ghost" className="text-xs bg-muted/50 text-foreground hover:bg-muted max-sm:min-h-11 whitespace-normal h-auto py-1.5" onClick={() => { const st = useLeftBehindStore.getState(); if (st.followTargetId === null) st.toggleHardwareFollow(); }}><Compass className="w-3 h-3" />{t.flyTo}</Button>
      <Button size="sm" variant="ghost" className="text-xs bg-muted/50 text-foreground hover:bg-muted max-sm:min-h-11 whitespace-normal h-auto py-1.5" onClick={() => useSimClock.getState().setSimDate(Date.parse(machine.landingDate ?? machine.launchDate))}><CalendarClock className="w-3 h-3" />{t.showTimeline}</Button>
    </div>

    <Dialog open={!!open} onOpenChange={o => !o && setOpen(null)}>
      <DialogContent className="paledot dark max-w-[min(96vw,1100px)] border-border bg-background p-3">
        {open && <><DialogTitle className="sr-only">{capt(open)}</DialogTitle><DialogDescription className="sr-only">{open.alt}</DialogDescription>
          <img src={open.imageUrl} alt={open.alt} className="max-h-[78vh] w-full object-contain" />
          <p className="text-sm text-foreground">{capt(open)}<span className="block text-xs text-muted-foreground"><a href={open.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{open.credit} · {open.nasaId}</a></span></p></>}
      </DialogContent>
    </Dialog>
  </div>;
}
