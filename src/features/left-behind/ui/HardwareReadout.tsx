// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect, useState } from 'react';
import { Box,ChevronDown,ChevronUp,Navigation,X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { useLeftBehindStore } from '../state/useLeftBehindStore';
import { useSimClock } from '../state/useSimClock';
import { measurementsAt, loadTrajectory } from '../engine/trajectory';
import { AU_KM } from '../engine/ephemeris';
import { machineCopy } from '../lib/machineCopy';
import { hasNasaModel,NasaModelInspector } from './NasaModelInspector';
export function HardwareReadout() {
  const {language,numberLocale}=useLanguage();const copy=machineCopy[language];
  const id=useLeftBehindStore(s=>s.selectedHardwareId);
  const following=useLeftBehindStore(s=>s.followTargetId!==null);
  const second=useSimClock(s=>Math.floor(s.simDate/1000));
  const [ready,setReady]=useState('');const [note,setNote]=useState(false);
  const [minimized,setMinimized]=useState(false);const [inspect,setInspect]=useState(false);
  useEffect(()=>{setNote(localStorage.getItem('pd-machine-scale-dismissed')!=='1');},[]);
  useEffect(()=>{if(id)void loadTrajectory(id).then(()=>setReady(id)).catch(()=>setReady(''));},[id]);
  const p=id&&ready===id?measurementsAt(id,new Date(second*1000)):null;
  const format=(n:number,digits=0)=>n.toLocaleString(numberLocale,{maximumFractionDigits:digits});
  const source=p?.extrapolated?copy.estimate:p?.source==='simplified'?copy.simplified:copy.calculated;
  return <>
    {note&&!id&&<div className="pd-card pd-machine-note flex items-center gap-2 text-muted-foreground" data-machine-note><span>{copy.note}</span><Button size="icon" variant="ghost" className="shrink-0 h-11 w-11" aria-label={copy.dismiss} onClick={()=>{setNote(false);localStorage.setItem('pd-machine-scale-dismissed','1');}}><X className="h-4 w-4"/></Button></div>}
    {id&&<section className="pd-card pd-machine-readout text-foreground" data-machine-readout aria-label={id.replaceAll('-',' ')}>
      <div className="flex items-center gap-1 p-2"><Button variant="ghost" className="flex-1 min-w-0 h-11 justify-between px-2" aria-expanded={!minimized} onClick={()=>setMinimized(!minimized)}><h2>{id.replaceAll('-',' ').toUpperCase()}</h2>{minimized?<ChevronUp className="h-4 w-4"/>:<ChevronDown className="h-4 w-4"/>}</Button><Button size="icon" variant="ghost" aria-label={copy.cardClose} className="h-11 w-11 shrink-0" onClick={()=>useLeftBehindStore.getState().selectHardware(null)}><X className="h-4 w-4"/></Button></div>
      {!minimized&&<div className="border-t border-border p-3 space-y-3 max-h-[45dvh] overflow-y-auto">
      {p?<><dl className="grid grid-cols-2 gap-x-3 gap-y-3 font-mono text-[11px] tabular-nums"><div className="col-span-2"><dt className="text-muted-foreground mb-1">{copy.sun}</dt><dd>{format(p.sunKm/AU_KM,3)} {copy.au} · {format(p.sunKm)} km</dd></div><div className="col-span-2"><dt className="text-muted-foreground mb-1">{copy.earth}</dt><dd>{format(p.earthKm)} km</dd></div><div><dt className="text-muted-foreground mb-1">{copy.light}</dt><dd>{format(p.lightSeconds,1)} {copy.seconds}</dd></div><div><dt className="text-muted-foreground mb-1">{copy.speed}</dt><dd>{p.speed===null?copy.unavailable:`${format(p.speed,2)} km/s`}</dd></div></dl><p className="font-mono text-[10px] text-muted-foreground" aria-live="polite">{source}</p></>:<p className="font-mono text-xs">{copy.unavailable}</p>}
      <div className="flex gap-2"><Button variant="outline" className="h-11 flex-1 border-border text-xs" onClick={()=>useLeftBehindStore.getState().toggleHardwareFollow()}><Navigation className="h-4 w-4"/>{following?copy.unfollow:copy.follow}</Button>{hasNasaModel(id)&&<Button variant="outline" className="h-11 flex-1 border-border text-xs" onClick={()=>setInspect(true)}><Box className="h-4 w-4"/>{copy.inspect}</Button>}</div>
      {note&&<div className="flex items-center gap-2 border-t border-border pt-2 text-[10px] text-muted-foreground"><span className="flex-1">{copy.note}</span><Button size="icon" variant="ghost" className="h-11 w-11 shrink-0" aria-label={copy.dismiss} onClick={()=>{setNote(false);localStorage.setItem('pd-machine-scale-dismissed','1');}}><X className="h-4 w-4"/></Button></div>}
      </div>}
    </section>}
    {inspect&&id&&<NasaModelInspector id={id} onClose={()=>setInspect(false)}/>}
  </>;
}