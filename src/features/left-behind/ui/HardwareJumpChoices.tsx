// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect,useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { getHardware } from '../data/dataClient';
import { loadTrajectory } from '../engine/trajectory';
import { canFollowHardware,followHardware } from '../lib/hardwareNavigation';
import { machineCopy } from '../lib/machineCopy';
import { useSimClock } from '../state/useSimClock';
import { useLeftBehindStore } from '../state/useLeftBehindStore';
import { JumpCategory } from './JumpCategory';
export function HardwareJumpChoices({expanded,onToggle}:{expanded:boolean;onToggle:()=>void}){
  const {language}=useLanguage();const copy=machineCopy[language];
  const second=useSimClock(s=>Math.floor(s.simDate/1000));
  const selected=useLeftBehindStore(s=>s.selectedHardwareId);
  const [ids,setIds]=useState<string[]>([]);
  useEffect(()=>{let alive=true;void getHardware().then(async h=>{
    const ids=h.machines.flatMap(m=>m.trajectories.map(t=>t.id));await Promise.allSettled(ids.map(loadTrajectory));if(alive)setIds(ids);
  });return()=>{alive=false;};},[]);
  return <div data-hardware-jumps><JumpCategory title={copy.machines} expanded={expanded} onToggle={onToggle}>
    {ids.map(id=>{const available=canFollowHardware(id,second*1000);const name=id.replaceAll('-',' ').replace(/\b\w/g,c=>c.toUpperCase());return <Button key={id} variant="ghost" disabled={!available} title={!available?copy.availability:undefined} aria-label={`${copy.select} ${name}`} onClick={()=>followHardware(id)} className={`w-full h-auto min-h-7 max-sm:min-h-11 justify-start gap-2 p-1.5 rounded-[4px] text-xs font-normal ${selected===id?'bg-primary/15 text-primary':'text-muted-foreground hover:text-foreground hover:bg-accent/60'}`}><span className={`w-2 h-2 rounded-full shrink-0 ${selected===id?'bg-primary':'bg-muted-foreground'}`}/><span className="truncate">{name}</span></Button>;})}
    </JumpCategory>
  </div>;
}