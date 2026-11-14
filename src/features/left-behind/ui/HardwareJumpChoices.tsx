// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect,useState } from 'react';
import { Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { getHardware } from '../data/dataClient';
import { loadTrajectory } from '../engine/trajectory';
import { canFollowHardware,followHardware } from '../lib/hardwareNavigation';
import { machineCopy } from '../lib/machineCopy';
import { useSimClock } from '../state/useSimClock';
import { useLeftBehindStore } from '../state/useLeftBehindStore';
export function HardwareJumpChoices(){
  const {language,tr}=useLanguage();const copy=machineCopy[language];
  const second=useSimClock(s=>Math.floor(s.simDate/1000));
  const selected=useLeftBehindStore(s=>s.selectedHardwareId);
  const [ids,setIds]=useState<string[]>([]);
  useEffect(()=>{let alive=true;void getHardware().then(async h=>{
    const ids=h.machines.flatMap(m=>m.trajectories.map(t=>t.id));await Promise.allSettled(ids.map(loadTrajectory));if(alive)setIds(ids);
  });return()=>{alive=false;};},[]);
  return <div className="border-t border-border p-2" data-hardware-jumps>
    <h3 className="px-2 py-2 text-xs font-medium text-muted-foreground">{tr({en:copy.machines,fr:copy.machines})}</h3>
    {ids.map(id=>{const available=canFollowHardware(id,second*1000);return <Button key={id} variant="ghost" disabled={!available} aria-label={`${copy.select} ${id.replaceAll('-',' ').toUpperCase()}`} onClick={()=>followHardware(id)} className={`w-full min-h-11 justify-between px-2 text-xs ${selected===id?'bg-primary/15 text-primary':'text-foreground'}`}><span>{id.replaceAll('-',' ').toUpperCase()}</span><Navigation className="h-3.5 w-3.5"/></Button>;})}
    <p className="px-2 pt-2 text-[10px] text-muted-foreground">{tr({en:copy.availability,fr:copy.availability})}</p>
  </div>;
}