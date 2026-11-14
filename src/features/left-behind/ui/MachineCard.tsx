// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarClock, Compass, ExternalLink, EyeOff, Map } from 'lucide-react';
import type { Machine, Photo } from '../data/types';
import { getPhotoManifest } from '../data/dataClient';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useLanguage } from '@/i18n/LanguageContext';
import { cardCopy, placeNames } from '../lib/cardCopy';
import { dataText, captionText } from '../lib/dataText';
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

type Action = { key: string; icon: React.ReactNode; label: string; onClick?: () => void; disabled?: boolean };
export function MachineCard({ machine, following = false, extra = [], unfollowLabel }: { machine: CardMachine; following?: boolean; extra?: Action[]; unfollowLabel?: string }) {
  const { language, numberLocale } = useLanguage();
  const t = cardCopy[language];
  const [photos, setPhotos] = useState<ManifestPhoto[] | null>(null);
  const [open, setOpen] = useState<ManifestPhoto | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const wheelAt = useRef(0);
  const onWheel = (e: React.WheelEvent) => {
    if (!api) return; const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(d) < 4) return;
    if ((d > 0 && !api.canScrollNext()) || (d < 0 && !api.canScrollPrev())) return;
    e.stopPropagation(); const now = Date.now(); if (now - wheelAt.current < 350) return; wheelAt.current = now;
    if (d > 0) api.scrollNext(); else api.scrollPrev();
  };
  useEffect(() => { let live = true; void getPhotoManifest().then(list => { if (live) setPhotos((list as ManifestPhoto[]).filter(p => p.machineId === machine.id && !PALE_BLUE.test(p.role ?? ''))); }).catch(() => live && setPhotos([])); return () => { live = false; }; }, [machine.id]);
  const capt = (p: ManifestPhoto) => captionText(p.id, p.caption, language) || p.title;
  const T = (x: string) => dataText(x, language);

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
  const heading = 'text-white/50 text-xs';
  const Bullets = ({ items }: { items: { k: string; text: string }[] }) => <ul className="space-y-1">{items.map(i => <li key={i.k} className="text-white/80 text-xs flex items-start gap-1.5"><span className="text-white/40 mt-0.5">•</span><span>{i.text}</span></li>)}</ul>;

  return <div className="space-y-3" data-machine-card>
    <div className="flex flex-wrap items-center gap-2">
      <p className="sr-only">{[kind, place, year].filter(Boolean).join(' · ')}</p>
      {statusText && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/80 border border-white/20" data-machine-status>{statusText}</span>}
    </div>

    <section aria-label={t.photos}>
      {photos === null ? <div className="aspect-[4/3] rounded-[6px] border border-border bg-muted/40" />
        : photos.length === 0 ? <p className="text-xs text-muted-foreground">TODO(source)</p>
        : <div onWheel={onWheel}><Carousel setApi={setApi} opts={{ align: 'start' }}><CarouselContent className="-ml-2">{photos.map(p => <CarouselItem key={p.id} className="pl-2 basis-[85%]"><PhotoBox photo={p} caption={capt(p)} onOpen={() => setOpen(p)} label={t.openPhoto} missing={t.photoUnavailable} /></CarouselItem>)}</CarouselContent></Carousel></div>}
      {photos && photos.length === 1 && <p className="mt-1 text-xs text-muted-foreground">TODO(source)</p>}
    </section>

    {did.length > 0 && <section className="space-y-1"><h4 className={heading}>{t.whatItDid}</h4><Bullets items={did.map(f => ({ k: f.id, text: T(f.text) }))} /></section>}
    {machine.leftBehind?.length ? <section className="space-y-1"><h4 className={heading}>{t.leftBehind}</h4><Bullets items={machine.leftBehind.map(x => ({ k: x, text: T(x) }))} /></section> : null}
    <section className="space-y-1"><h4 className={heading}>{t.whereNow}</h4>
      <p className="text-white/80 text-xs">{machine.whereNow ? T(machine.whereNow) : 'TODO(source)'}</p>
      {distance !== null && <div className="bg-white/5 rounded-[4px] p-2 text-xs sm:text-sm"><div className="text-white/50 text-xs">{t.distanceToday}</div><div className="text-white font-medium tabular-nums">{Math.round(distance).toLocaleString(numberLocale)} km<span className="block text-[10px] text-muted-foreground">{t.calculated}</span></div></div>}
    </section>
    {machine.keyDates?.length ? <section className="space-y-1"><h4 className={heading}>{t.keyDates}</h4>
      <dl className="grid grid-cols-2 gap-2 text-xs">{machine.keyDates.map(d => <div key={d.label + d.date} className="bg-white/5 rounded-[4px] p-2"><dt className="text-white/50 text-xs">{T(d.label)}</dt><dd className="text-white font-medium tabular-nums">{fmtDate(d.date)}<span className="block text-[10px] text-muted-foreground">{d.factId ? t.nasaReported : 'TODO(source)'}</span></dd></div>)}</dl>
    </section> : null}
    {machine.sources?.length ? <section className="space-y-1"><h4 className={heading}>{t.sources}</h4><ul className="space-y-1 text-xs">{machine.sources.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1 text-white/80 underline-offset-2 hover:underline hover:text-white">{T(s.title)}<ExternalLink className="mt-0.5 h-3 w-3 shrink-0" aria-hidden /></a></li>)}</ul></section> : null}

    {(() => {
      const actions: Action[] = [
        { key: 'tour', icon: <Map className="w-3 h-3" />, label: t.takeTour, disabled: true },
        following && unfollowLabel
          ? { key: 'fly', icon: <EyeOff className="w-3 h-3" />, label: unfollowLabel, onClick: () => useLeftBehindStore.getState().toggleHardwareFollow() }
          : { key: 'fly', icon: <Compass className="w-3 h-3" />, label: t.flyTo, onClick: () => { const st = useLeftBehindStore.getState(); if (st.followTargetId === null) st.toggleHardwareFollow(); } },
        { key: 'time', icon: <CalendarClock className="w-3 h-3" />, label: t.showTimeline, onClick: () => useSimClock.getState().setSimDate(Date.parse(machine.landingDate ?? machine.launchDate)) },
        ...extra,
      ];
      // Two columns; with an odd count the first action takes the full row.
      return <div className="grid grid-cols-2 gap-2 pt-1">{actions.map((a, i) => <Button key={a.key} size="sm" disabled={a.disabled} onClick={a.onClick} className={`max-sm:h-11 gap-1.5 text-xs bg-white/10 hover:bg-white/20 text-white border-0 ${i === 0 && actions.length % 2 ? 'col-span-2' : ''}`}>{a.icon}<span className="truncate">{a.label}</span></Button>)}</div>;
    })()}

    <Dialog open={!!open} onOpenChange={o => !o && setOpen(null)}>
      <DialogContent className="paledot dark max-w-[min(96vw,1100px)] border-border bg-background p-3">
        {open && <><DialogTitle className="sr-only">{capt(open)}</DialogTitle><DialogDescription className="sr-only">{open.alt}</DialogDescription>
          <img src={open.imageUrl} alt={open.alt} className="max-h-[78vh] w-full object-contain" />
          <p className="text-sm text-foreground">{capt(open)}<span className="block text-xs text-muted-foreground"><a href={open.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{open.credit} · {open.nasaId}</a></span></p></>}
      </DialogContent>
    </Dialog>
  </div>;
}
