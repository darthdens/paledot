// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCosmosStore } from '@/components/cosmos/store/useCosmosStore';
import { getLookData, getPhotoManifest, getTrajectory } from '../data/dataClient';
import type { Photo } from '../data/types';
import { evaluateTrajectory } from '../engine/trajectory';
import { lookCopy } from '../lib/oneLastLookCopy';
import { LOOK_DATE, lastLookProgress, lookMeasurements, pixelWidths, PORTRAIT_PLANETS, useOneLastLook } from '../lib/oneLastLook';
import { useTourPlayback } from '../lib/useTourPlayback';

const frames = [
  { i: 2, x: 39 / 1280, y: 123 / 384, w: 52 / 1280, h: 53 / 384 },
  { i: 1, x: 83 / 1280, y: 213 / 384, w: 53 / 1280, h: 52 / 384 },
  { i: 0, x: 128 / 1280, y: 302 / 384, w: 53 / 1280, h: 53 / 384 },
  { i: 3, x: 553 / 1280, y: 297 / 384, w: 53 / 1280, h: 53 / 384 },
  { i: 4, x: 814 / 1280, y: 195 / 384, w: 53 / 1280, h: 53 / 384 },
  { i: 5, x: 1155 / 1280, y: 300 / 384, w: 53 / 1280, h: 53 / 384 },
];

export type LastLookPanel = { title: string; label: string; progress: number; children: ReactNode; previous: () => void; next: () => void; nextDisabled?: boolean };

export function OneLastLook({ onPrevious, onNext, tourIndex, totalStops, renderPanel }: { onPrevious: () => void; onNext: () => void; tourIndex: number; totalStops: number; renderPanel: (panel: LastLookPanel) => ReactNode }) {
  const { language, numberLocale } = useLanguage();
  const c = lookCopy[language as keyof typeof lookCopy] ?? lookCopy.en;
  const stage = useOneLastLook(s => s.stage);
  const points = useOneLastLook(s => s.points);
  const paused = useCosmosStore(s => s.isPaused);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [revisited, setRevisited] = useState(false);
  const [portrait, setPortrait] = useState(false);
  const [planet, setPlanet] = useState<number | null>(null);
  const [dpr, setDpr] = useState(1);
  const [measure, setMeasure] = useState<ReturnType<typeof lookMeasurements> | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    useOneLastLook.getState().setStage(0);
    setDpr(window.devicePixelRatio || 1);
    let alive = true;
    void Promise.all([getPhotoManifest(), getTrajectory('voyager-1'), getLookData()]).then(([images, track, data]) => {
      const p = evaluateTrajectory(track, new Date(LOOK_DATE));
      if (!p || p.source !== 'horizons') throw new Error('Missing Horizons position');
      const result = lookMeasurements(p.km, data.earthKm, data.earthDiameterKm);
      if (alive) { setPhotos(images); setMeasure(result); }
    }).catch(() => { if (alive) setError(true); });
    return () => { alive = false; useOneLastLook.getState().setStage(0); };
  }, []);
  const next = () => {
    if (error || !measure) return;
    if (stage < 5) { setPortrait(false); useOneLastLook.getState().setStage(stage + 1); }
    else onNext();
  };
  const previous = () => { setPortrait(false); if (stage > 0) useOneLastLook.getState().setStage(stage - 1); else onPrevious(); };
  useTourPlayback(`last-look:${stage}`, paused || portrait || error || !measure, stage === 1 ? 4 : stage === 3 ? 24 : 14, next);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight', 'Space', 'Escape'].includes(e.code)) return;
      if (e.target instanceof Element && e.target.closest('button')) return;
      e.preventDefault();
      if (e.code === 'ArrowRight') next();
      if (e.code === 'ArrowLeft') previous();
      if (e.code === 'Space') useCosmosStore.getState().togglePause();
      if (e.code === 'Escape') useCosmosStore.getState().stopTour();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [stage, portrait, error, measure]);
  const photo = photos.find(p => p.role === (portrait ? 'family-portrait' : revisited ? 'pale-blue-dot-revisited' : 'pale-blue-dot'));
  const widths = pixelWidths(dpr);
  const fmt = (value: number, digits = 0) => new Intl.NumberFormat(numberLocale, { maximumFractionDigits: digits }).format(value);
  const progress = lastLookProgress(tourIndex, stage, totalStops);
  const heading = (stage === 3 ? 'Pale Blue Dot' : stage === 4 ? c[10] : stage === 2 ? c[3] : c[0]) ?? '';
  return <div className="absolute inset-0 z-[10001] pointer-events-none [&_[data-tour-panel]]:pointer-events-auto" data-one-last-look data-look-stage={stage}>
    {(stage === 1 || stage === 2) && PORTRAIT_PLANETS.map((id, i) => {
      const p = points[id];
      return p && <div key={id} className="absolute -translate-x-1/2 -translate-y-1/2 text-primary" style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}>
        <span className="block h-5 w-5 rounded-full border border-primary" />
        <span className="absolute left-7 top-0 font-mono text-[11px] uppercase whitespace-nowrap">{c[23 + i]}</span>
      </div>;
    })}
    {renderPanel({ title: heading, label: progress.label, progress: progress.fraction, previous, next, nextDisabled: error || !measure, children: <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-foreground/80 leading-relaxed">
        <p className="font-mono text-[11px] text-muted-foreground">{c[14]}</p>
        {error ? <p>TODO(source): JPL Horizons</p> : <>
          {stage === 0 && <><p>{c[1]}</p><p className="text-xs text-muted-foreground">{c[29]}</p></>}
          {stage === 1 && <p>{c[2]}</p>}
          {stage === 2 && measure && <>
            <dl className="space-y-4">
              <div><dt className="text-muted-foreground">{c[15]}</dt><dd className="font-mono tabular-nums text-sm sm:text-base">{fmt(measure.distanceKm)} km</dd><dd className="text-xs text-muted-foreground">{c[4]}</dd></div>
              <div><dt className="text-muted-foreground">{c[16]}</dt><dd className="font-mono tabular-nums text-sm sm:text-base">{fmt(measure.angularRadians * 206264.806, 3)} ″</dd><dd className="text-xs text-muted-foreground">{c[4]}</dd></div>
            </dl><p>{c[5]}<span className="block text-xs text-muted-foreground">{c[6]}</span></p>
          </>}
          {((stage === 3) || portrait) && photo && <>
            {!portrait && <div className="flex flex-wrap gap-2">{[false, true].map(v => <Button key={String(v)} variant="ghost" aria-pressed={v === revisited} className={`min-h-11 rounded-full border ${v === revisited ? 'border-primary text-primary' : 'border-border'}`} onClick={() => setRevisited(v)}>{c[v ? 8 : 7]}</Button>)}</div>}
            <figure>
              <div className={`relative mx-auto w-full ${portrait ? '' : 'max-w-44'}`} style={{ aspectRatio: portrait ? '1280 / 384' : revisited ? '1280 / 1266' : '453 / 614' }}>
                <img key={photo.id} src={photo.imageUrl} alt={portrait ? c[13] : heading} className="absolute inset-0 h-full w-full object-contain motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700" />
                {!portrait && photo.earthMarker && <span data-earth-ring className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary" style={{ left: `${photo.earthMarker.x * 100}%`, top: `${photo.earthMarker.y * 100}%` }} />}
                {portrait && frames.map(f => <Button key={f.i} variant="ghost" aria-label={c[23 + f.i]} className="absolute min-h-11 min-w-11 p-0 border border-transparent focus-visible:border-primary hover:border-primary rounded-none" style={{ left: `${f.x * 100}%`, top: `${f.y * 100}%`, width: `${f.w * 100}%`, height: `${f.h * 100}%` }} onClick={() => setPlanet(f.i)} />)}
              </div>
              <figcaption className="mt-2 text-xs text-muted-foreground"><a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">{photo.credit} · {photo.nasaId}</a></figcaption>
            </figure>
            {portrait ? <p>{planet === null ? c[13] : c[23 + planet]}</p> : <><p className="text-xs text-muted-foreground">{c[22]}</p><p>{c[9]}</p></>}
          </>}
          {stage === 4 && <><div className="flex justify-center items-center gap-10 py-8"><div className="h-24 w-24 rounded-full border border-border grid place-items-center"><span data-screen-pixel className="bg-primary" style={{ width: widths.screen, height: widths.screen }} /></div><div className="h-24 w-24 rounded-full border border-border grid place-items-center"><span data-voyager-pixel className="bg-primary" style={{ width: widths.voyager, height: widths.voyager }} /></div></div><p>{c[11]}</p><p className="text-xs text-muted-foreground">{c[6]} · <a href="https://images.nasa.gov/details/PIA00452" target="_blank" rel="noopener noreferrer" className="underline">NASA/JPL-Caltech</a></p></>}
          {stage === 5 && <><p className="text-sm sm:text-base">{c[12]}</p><Button variant="ghost" aria-pressed={portrait} className="min-h-11 border border-border rounded-full" onClick={() => setPortrait(!portrait)}>{c[13]}</Button></>}
        </>}
      </div> })}
  </div>;
}
