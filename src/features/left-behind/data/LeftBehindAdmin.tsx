// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect, useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { getPhotoManifest, getTrajectory } from './dataClient';
import type { Photo, Trajectory } from './types';

const words = {
  en: ['Left Behind · data', 'Trajectories', 'Loading…', 'Item', 'Source', 'Points', 'Date range (UTC)', 'Photographs', 'NASA ID', 'Title', 'Credit', 'Simplified path', 'Calculated from JPL Horizons data'],
  fr: ['Left Behind · données', 'Trajectoires', 'Chargement…', 'Élément', 'Source', 'Points', 'Période (UTC)', 'Photographies', 'Identifiant NASA', 'Titre', 'Crédit', 'Trajectoire simplifiée', 'Calculé à partir des données JPL Horizons'],
  es: ['Left Behind · datos', 'Trayectorias', 'Cargando…', 'Elemento', 'Fuente', 'Puntos', 'Periodo (UTC)', 'Fotografías', 'ID NASA', 'Título', 'Crédito', 'Trayectoria simplificada', 'Calculado a partir de datos de JPL Horizons'],
  pt: ['Left Behind · dados', 'Trajetórias', 'A carregar…', 'Elemento', 'Fonte', 'Pontos', 'Período (UTC)', 'Fotografias', 'ID NASA', 'Título', 'Crédito', 'Trajetória simplificada', 'Calculado a partir dos dados JPL Horizons'],
  it: ['Left Behind · dati', 'Traiettorie', 'Caricamento…', 'Elemento', 'Fonte', 'Punti', 'Periodo (UTC)', 'Fotografie', 'ID NASA', 'Titolo', 'Credito', 'Traiettoria semplificata', 'Calcolato dai dati JPL Horizons'],
  de: ['Left Behind · Daten', 'Flugbahnen', 'Wird geladen…', 'Eintrag', 'Quelle', 'Punkte', 'Zeitraum (UTC)', 'Fotografien', 'NASA-ID', 'Titel', 'Bildnachweis', 'Vereinfachte Flugbahn', 'Aus JPL-Horizons-Daten berechnet'],
};
const ids = ['voyager-1', 'voyager-2', 'ingenuity', 'opportunity', 'viking-1', 'apollo-11', 'apollo-15', 'apollo-16', 'apollo-17'];
type PreviewPhoto = Omit<Photo, 'caption'> & { caption: string | { en: string; fr: string } };
const photoLabels = {
  en: ['Thumbnail', 'Caption'], fr: ['Miniature', 'Légende'],
  es: ['Miniatura', 'Leyenda'], pt: ['Miniatura', 'Legenda'],
  it: ['Miniatura', 'Didascalia'], de: ['Vorschaubild', 'Bildunterschrift'],
};

export default function LeftBehindAdmin() {
  const { language, tr } = useLanguage();
  const text = words[language];
  const label = (index: number) => tr({ en: text[index] ?? '', fr: text[index] ?? '' });
  const [rows, setRows] = useState<Trajectory[]>([]);
  const [photos, setPhotos] = useState<PreviewPhoto[]>([]);
  const [error, setError] = useState(false);
  const [enabled, setEnabled] = useState(false);
  useEffect(() => { setEnabled(new URLSearchParams(window.location.search).get('lb-admin') === '1'); }, []);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    Promise.all([Promise.all(ids.map(getTrajectory)), getPhotoManifest()]).then(([data, manifest]) => {
      if (active) { setRows(data); setPhotos(manifest); }
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [enabled]);
  if (!enabled) return null;
  return <section className="paledot dark fixed inset-x-0 bottom-0 z-[100] max-h-[65dvh] overflow-auto border-t border-border bg-background p-4 text-foreground" aria-label={label(0)}>
    <h2 className="text-lg">{label(0)}</h2>
    <div aria-live="polite">{error ? 'TODO(source)' : !rows.length ? label(2) : null}</div>
    <h3 className="mt-4">{label(1)}</h3>
    <div className="overflow-x-auto" tabIndex={0}><table className="w-full text-left text-sm" aria-label={label(1)}><thead><tr>{[3, 4, 6, 5].map(index => <th className="px-2 py-3" key={index}>{label(index)}</th>)}</tr></thead><tbody>{rows.map(row => {
      const segments = row.segments ?? [];
      const starts = segments.map(s => Date.parse(s.start));
      const ends = segments.map(s => Date.parse(s.start) + Math.max(0, s.positions.length - 1) * s.stepSeconds * 1000);
      const start = starts.length ? new Date(Math.min(...starts)).toISOString() : row.milestones?.launch;
      const end = ends.length ? new Date(Math.max(...ends)).toISOString() : row.milestones?.arrival;
      return <tr key={row.id} className="border-t border-border"><td className="px-2 py-3 whitespace-nowrap">{row.id}</td><td className="px-2 py-3">{row.source}<div className="text-xs text-muted-foreground">{label(row.source === 'simplified' ? 11 : 12)}</div></td><td className="px-2 py-3 font-mono text-xs whitespace-nowrap">{start} → {end}</td><td className="px-2 py-3 font-mono tabular-nums">{segments.reduce((sum, s) => sum + s.positions.length, 0)}</td></tr>;
    })}</tbody></table></div>
    <h3 className="mt-4">{label(7)}</h3>
    <div className="overflow-x-auto" tabIndex={0}><table className="w-full text-left text-sm" aria-label={label(7)}><thead><tr><th className="px-2 py-3">{photoLabels[language][0]}</th>{[3, 8].map(index => <th className="px-2 py-3" key={index}>{label(index)}</th>)}<th className="px-2 py-3">{photoLabels[language][1]}</th><th className="px-2 py-3">{label(10)}</th></tr></thead><tbody>{photos.map(photo => {
      const caption = typeof photo.caption === 'string' ? photo.caption : tr(photo.caption);
      return <tr key={photo.id} className="border-t border-border"><td className="px-2 py-3"><div className="h-16 w-20">{photo.imageUrl && <img src={photo.imageUrl} alt={caption} width={80} height={64} loading="lazy" className="h-full w-full rounded-sm object-contain" />}</div></td><td className="px-2 py-3 whitespace-nowrap">{photo.machineId}</td><td className="px-2 py-3">{photo.nasaId || 'TODO(source)'}</td><td className="px-2 py-3 min-w-48">{caption}</td><td className="px-2 py-3 min-w-48 text-xs text-muted-foreground">{photo.credit} · {photo.title}</td></tr>;
    })}</tbody></table></div>
  </section>;
}
