// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { useLeftBehindStore } from '../state/useLeftBehindStore';
import { useSimClock } from '../state/useSimClock';
import { measurementsAt, loadTrajectory } from '../engine/trajectory';
import { AU_KM } from '../engine/ephemeris';
import { machineCopy } from '../lib/machineCopy';
export function HardwareReadout() {
  const {language,numberLocale}=useLanguage();const copy=machineCopy[language];
  const id=useLeftBehindStore(s=>s.selectedHardwareId);
  const second=useSimClock(s=>Math.floor(s.simDate/1000));
  const [ready,setReady]=useState('');const [note,setNote]=useState(false);
  useEffect(()=>{setNote(localStorage.getItem('pd-machine-scale-dismissed')!=='1');},[]);
  useEffect(()=>{if(id)void loadTrajectory(id).then(()=>setReady(id)).catch(()=>setReady(''));},[id]);
  const p=id&&ready===id?measurementsAt(id,new Date(second*1000)):null;
  const format=(n:number,digits=0)=>n.toLocaleString(numberLocale,{maximumFractionDigits:digits});
  const source=p?.extrapolated?copy.estimate:p?.source==='simplified'?copy.simplified:copy.calculated;
  return <>
    {note&&<div className="pd-card pd-machine-note flex items-center gap-2 text-muted-foreground" data-machine-note><span>{copy.note}</span><Button size="icon" variant="ghost" className="shrink-0 min-h-11 min-w-11" aria-label={copy.dismiss} onClick={()=>{setNote(false);localStorage.setItem('pd-machine-scale-dismissed','1');}}><X className="h-4 w-4"/></Button></div>}
    {id&&<section className="pd-card pd-machine-readout text-foreground" data-machine-readout aria-label={id.replaceAll('-',' ')}>
      <div className="flex items-center justify-between gap-2"><h2 className="font-mono text-xs uppercase">{id.replaceAll('-',' ')}</h2><Button size="icon" variant="ghost" aria-label={copy.close} className="min-h-11 min-w-11" onClick={()=>useLeftBehindStore.getState().selectHardware(null)}><X className="h-4 w-4"/></Button></div>
      {p?<><dl className="space-y-2 font-mono text-[11px] tabular-nums"><div><dt className="text-muted-foreground">{copy.sun}</dt><dd>{format(p.sunKm/AU_KM,3)} {copy.au} · {format(p.sunKm)} km</dd></div><div><dt className="text-muted-foreground">{copy.earth}</dt><dd>{format(p.earthKm)} km</dd></div><div><dt className="text-muted-foreground">{copy.light}</dt><dd>{format(p.lightSeconds,1)} {copy.seconds}</dd></div><div><dt className="text-muted-foreground">{copy.speed}</dt><dd>{p.speed===null?copy.unavailable:`${format(p.speed,2)} km/s`}</dd></div></dl><p className="mt-3 font-mono text-[10px] text-muted-foreground" aria-live="polite">{source}</p></>:<p className="font-mono text-xs">{copy.unavailable}</p>}
    </section>}
  </>;
}