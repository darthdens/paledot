// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect, useState } from 'react';
import { Box, Eye, EyeOff, MapPin, X } from 'lucide-react';
import { landedPins } from '../lib/pinRegistry';
import type { Machine } from '../data/types';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { useLeftBehindStore } from '../state/useLeftBehindStore';
import { useSimClock } from '../state/useSimClock';
import { measurementsAt, loadTrajectory } from '../engine/trajectory';
import { AU_KM } from '../engine/ephemeris';
import { machineCopy, machineKinds } from '../lib/machineCopy';
import { getHardware } from '../data/dataClient';
import { hasNasaModel,NasaModelInspector } from './NasaModelInspector';
import { ObjectPanelHeader } from './ObjectPanelHeader';
import { useCosmosStore } from '@/components/cosmos/store/useCosmosStore';
export function HardwareReadout() {
  const {language,numberLocale}=useLanguage();const copy=machineCopy[language];
  const id=useLeftBehindStore(s=>s.selectedHardwareId);
  const selectedObject=useCosmosStore(s=>s.selectedObject);
  const isTouring=useCosmosStore(s=>s.isTouring);
  const following=useLeftBehindStore(s=>s.followTargetId!==null);
  const second=useSimClock(s=>Math.floor(s.simDate/1000));
  const [ready,setReady]=useState('');const [note,setNote]=useState(false);
  const [kind,setKind]=useState<string|null>(null);const [machine,setMachine]=useState<Machine|null>(null);
  useEffect(()=>{setKind(null);setMachine(null);if(!id)return;let live=true;void getHardware().then(h=>{const m=h.machines.find(m=>m.trajectories.some(t=>t.id===id));if(live){setKind(m?.kind ?? null);setMachine(m ?? null);}}).catch(()=>{});return()=>{live=false;};},[id]);
  const [minimized,setMinimized]=useState(true);const [inspect,setInspect]=useState(false);
  useEffect(()=>{setNote(localStorage.getItem('pd-machine-scale-dismissed')!=='1');},[]);
  useEffect(()=>{if(id)void loadTrajectory(id).then(()=>setReady(id)).catch(()=>setReady(''));},[id]);
  useEffect(()=>{setMinimized(true);setInspect(false);},[id]);
  useEffect(()=>{if(selectedObject&&id)useLeftBehindStore.getState().selectHardware(null);},[selectedObject,id]);
  const landed=id?landedPins.has(id):false;
  const siteIndex=machine&&id?machine.trajectories.findIndex(t=>t.id===id):-1;
  const site=landed&&siteIndex>=0?machine?.sites?.[siteIndex]:undefined;
  // Sites without coordinates get no pin; they are listed as text instead.
  const unpinned=(machine?.sites ?? []).filter(s=>s.lat===null||s.lon===null);
  const p=id&&ready===id?measurementsAt(id,new Date(second*1000)):null;
  const format=(n:number,digits=0)=>n.toLocaleString(numberLocale,{maximumFractionDigits:digits});
  const source=p?.extrapolated?copy.estimate:p?.source==='simplified'?copy.simplified:copy.calculated;
  if(isTouring||selectedObject)return null;
  return <>
    {note&&!id&&<div className="pd-card pd-machine-note flex items-center gap-2 text-muted-foreground" data-machine-note><span>{copy.note}</span><Button size="icon" variant="ghost" className="shrink-0 h-11 w-11" aria-label={copy.dismiss} onClick={()=>{setNote(false);localStorage.setItem('pd-machine-scale-dismissed','1');}}><X className="h-4 w-4"/></Button></div>}
    {id&&<section className="pd-card pd-machine-readout text-foreground" data-machine-readout aria-label={id.replaceAll('-',' ')}>
      <ObjectPanelHeader title={id.replaceAll('-',' ').replace(/\b\w/g,c=>c.toUpperCase())} minimized={minimized} onToggle={()=>setMinimized(!minimized)} onClose={()=>useLeftBehindStore.getState().selectHardware(null)} closeLabel={copy.cardClose} />
      <div className={`grid transition-all duration-300 ease-out ${minimized?'grid-rows-[0fr]':'grid-rows-[1fr]'}`} inert={minimized}><div className="overflow-hidden"><div className="border-t border-border p-3 space-y-3 max-h-[40vh] sm:max-h-[45vh] overflow-y-auto">
      {kind&&<div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded-full text-xs font-medium border border-foreground/40 bg-foreground/20 text-foreground" data-machine-kind>{machineKinds[kind]?.[language] ?? kind}</span></div>}
      {p?<><dl className="grid grid-cols-2 gap-2 text-xs sm:text-sm tabular-nums"><div className="rounded-[4px] bg-muted/50 p-2"><dt className="text-muted-foreground text-xs">{copy.sun}</dt><dd className="font-medium">{format(p.sunKm/AU_KM,3)} {copy.au}<span className="block text-xs text-muted-foreground">{format(p.sunKm)} km</span></dd></div><div className="rounded-[4px] bg-muted/50 p-2"><dt className="text-muted-foreground text-xs">{copy.earth}</dt><dd className="font-medium break-words">{format(p.earthKm)} km</dd></div><div className="rounded-[4px] bg-muted/50 p-2"><dt className="text-muted-foreground text-xs">{copy.light}</dt><dd className="font-medium">{format(p.lightSeconds,1)} {copy.seconds}</dd></div><div className="rounded-[4px] bg-muted/50 p-2"><dt className="text-muted-foreground text-xs">{copy.speed}</dt><dd className="font-medium">{p.speed===null?copy.unavailable:`${format(p.speed,2)} km/s`}</dd></div></dl><p className="text-[10px] text-muted-foreground">{source}</p></>:site?<p className="text-xs"><span className="text-muted-foreground">{copy.location}: </span>{site.label}</p>:<p className="text-xs">{copy.unavailable}</p>}
      {unpinned.map(s=><p key={s.label} className="text-xs" data-unpinned-site><span className="text-muted-foreground">{copy.finalLocation}: </span>{s.label.replace(/\s*\(final location\)$/i,'')}</p>)}
      <div className="flex gap-2 pt-1"><Button size="sm" variant="ghost" className={`flex-1 text-xs max-sm:min-h-11 ${following?'bg-primary/15 text-primary hover:bg-primary/20':'bg-muted/50 text-foreground hover:bg-muted'}`} onClick={()=>useLeftBehindStore.getState().toggleHardwareFollow()}>{following?<EyeOff className="w-3 h-3"/>:<Eye className="w-3 h-3"/>}{following?copy.unfollow:copy.follow}</Button>{landed&&<Button size="sm" variant="ghost" className="flex-1 text-xs bg-muted/50 text-foreground hover:bg-muted max-sm:min-h-11 whitespace-normal" onClick={()=>useLeftBehindStore.getState().requestSurfaceView()}><MapPin className="w-3 h-3"/>{copy.surfaceView}</Button>}{hasNasaModel(id)&&<Button size="sm" variant="ghost" className="flex-1 text-xs bg-muted/50 text-foreground hover:bg-muted max-sm:min-h-11 whitespace-normal" onClick={()=>setInspect(true)}><Box className="w-3 h-3"/>{copy.inspect}</Button>}</div>
      {note&&<div className="flex items-center gap-2 border-t border-border pt-2 text-[10px] text-muted-foreground"><span className="flex-1">{copy.note}</span><Button size="icon" variant="ghost" className="h-11 w-11 shrink-0" aria-label={copy.dismiss} onClick={()=>{setNote(false);localStorage.setItem('pd-machine-scale-dismissed','1');}}><X className="h-4 w-4"/></Button></div>}
      </div></div></div>
    </section>}
    {inspect&&id&&<NasaModelInspector id={id} onClose={()=>setInspect(false)}/>}
  </>;
}