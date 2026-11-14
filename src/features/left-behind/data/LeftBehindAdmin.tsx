// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { leftBehindData } from './data.functions';
import { clearDataCache } from './dataClient';
import type { Machine, Photo, Trajectory } from './types';

const words = {
  en: ['Left Behind · data', 'Rebuild data', 'Building…', 'Item', 'Source', 'Points', 'Result', 'Administrator sign-in required', 'Data unavailable: check public storage and NASA sources', 'Saved'],
  fr: ['Left Behind · données', 'Reconstruire les données', 'Construction…', 'Élément', 'Source', 'Points', 'Résultat', 'Connexion administrateur requise', 'Données indisponibles : vérifiez le stockage public et les sources NASA', 'Enregistré'],
  es: ['Left Behind · datos', 'Reconstruir datos', 'Procesando…', 'Elemento', 'Fuente', 'Puntos', 'Resultado', 'Se requiere acceso de administrador', 'Datos no disponibles: revise el almacenamiento público y las fuentes NASA', 'Guardado'],
  pt: ['Left Behind · dados', 'Reconstruir dados', 'A processar…', 'Item', 'Fonte', 'Pontos', 'Resultado', 'É necessário iniciar sessão como administrador', 'Dados indisponíveis: verifique o armazenamento público e as fontes NASA', 'Guardado'],
  it: ['Left Behind · dati', 'Ricostruisci dati', 'Elaborazione…', 'Elemento', 'Fonte', 'Punti', 'Risultato', 'È richiesto l’accesso come amministratore', 'Dati non disponibili: controlla l’archiviazione pubblica e le fonti NASA', 'Salvato'],
  de: ['Left Behind · Daten', 'Daten neu erstellen', 'Wird erstellt…', 'Eintrag', 'Quelle', 'Punkte', 'Ergebnis', 'Administratoranmeldung erforderlich', 'Daten nicht verfügbar: öffentlichen Speicher und NASA-Quellen prüfen', 'Gespeichert'],
};
type Row = { id: string; source: string; points: number; result: string };

export default function LeftBehindAdmin() {
  const { language, tr } = useLanguage();
  const text = words[language];
  const label = (index: number) => tr({ en: text[index] ?? '', fr: text[index] ?? '' });
  const invoke = useServerFn(leftBehindData);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState(false);
  useEffect(() => { setEnabled(new URLSearchParams(window.location.search).get('lb-admin') === '1'); }, []);
  if (!enabled) return null;

  async function rebuild() {
    setBusy(true); setRows([]);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { setRows([{ id: '—', source: '—', points: 0, result: label(7) }]); return; }
      const headers = { Authorization: `Bearer ${data.session.access_token}` };
      const response = await fetch('/left-behind/hardware.json');
      if (!response.ok) throw new Error('Hardware source unavailable');
      const hardware: { machines: Machine[] } = await response.json();
      const jobs = [...hardware.machines.flatMap(machine => machine.trajectories.map(trajectory => ({ action: 'trajectory' as const, id: trajectory.id }))), { action: 'photos' as const }];
      for (const job of jobs) {
        const id = 'id' in job ? job.id : 'photos/manifest.json';
        try {
          const result = await invoke({ data: { ...job, rebuild: true }, headers });
          const trajectory = result as Trajectory;
          setRows(rows => [...rows, { id, source: Array.isArray(result) ? 'NASA' : trajectory.source, points: Array.isArray(result) ? (result as Photo[]).length : trajectory.segments?.reduce((sum, segment) => sum + segment.positions.length, 0) ?? 0, result: label(9) }]);
        } catch { setRows(rows => [...rows, { id, source: '—', points: 0, result: label(8) }]); }
      }
      clearDataCache();
    } finally { setBusy(false); }
  }
  return <section className="paledot dark fixed inset-x-0 bottom-0 z-[100] max-h-[65dvh] overflow-auto border-t border-border bg-background p-4 text-foreground" aria-label={label(0)}>
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg">{label(0)}</h2><Button className="pd-pill min-h-11" variant="outline" disabled={busy} onClick={rebuild}>{busy ? label(2) : label(1)}</Button></div>
    <div className="mt-4 overflow-x-auto" aria-live="polite"><table className="w-full text-left text-sm"><thead><tr>{[3, 4, 5, 6].map(index => <th className="px-2 py-3" key={index}>{label(index)}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id} className="border-t border-border"><td className="px-2 py-3">{row.id}</td><td className="px-2 py-3">{row.source}</td><td className="px-2 py-3 font-mono tabular-nums">{row.points}</td><td className="px-2 py-3">{row.result}</td></tr>)}</tbody></table></div>
  </section>;
}