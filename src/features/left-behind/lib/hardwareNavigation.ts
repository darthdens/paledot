// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useCosmosStore } from '@/components/cosmos/store/useCosmosStore';
import { getObjectById } from '@/components/cosmos/data/celestialObjects';
import { useLeftBehindStore } from '../state/useLeftBehindStore';
import { positionAt } from '../engine/trajectory';
import { useSimClock } from '../state/useSimClock';
import { landedPins } from './pinRegistry';
import { getHardware } from '../data/dataClient';

// Landing sites known from hardware.json, so landed machines stay reachable even when the Moon/Mars
// (and so their pins) aren't mounted, e.g. when the camera is outside the Solar System.
const landedSites = new Map<string, { body: 'moon' | 'mars'; date: number }>();
void getHardware().then(h => {
  for (const m of h.machines) {
    if (m.body !== 'moon' && m.body !== 'mars') continue;
    m.trajectories.forEach((t, i) => {
      const site = m.sites?.[i]; const date = Date.parse(site?.date ?? m.landingDate ?? '');
      if (site && site.lat !== null && site.lon !== null && Number.isFinite(date)) landedSites.set(t.id, { body: m.body as 'moon' | 'mars', date });
    });
  }
}).catch(() => {});

function landedSite(id: string, date: number) { const s = landedSites.get(id); return s && date >= s.date ? s : undefined; }

export function canFollowHardware(id:string,date=useSimClock.getState().simDate){return positionAt(id,new Date(date))!==null||landedPins.has(id)||!!landedSite(id,date);}

function select(id:string,distanceKm?:number|null){
  useCosmosStore.getState().setSelectedObject(null);
  useCosmosStore.setState({showQuickJump:false});
  useLeftBehindStore.setState({machinesVisible:true,menuOpen:false});
  if(distanceKm!==undefined)useLeftBehindStore.getState().tourFollow(id,distanceKm);
  else useLeftBehindStore.getState().selectHardware(id);
}

let pending: ReturnType<typeof setInterval> | null = null;
/** distanceKm (tours): camera distance for this flight; null = machine default. */
export function followHardware(id:string,distanceKm?:number|null){
  if(!canFollowHardware(id))return false;
  if(pending){clearInterval(pending);pending=null;}
  const date=useSimClock.getState().simDate;
  if(positionAt(id,new Date(date))!==null||landedPins.has(id)){select(id,distanceKm);return true;}
  // Pin not mounted yet: fly to its host body first, then follow once the pin registers.
  const site=landedSite(id,date); const body=site&&getObjectById(site.body);
  if(!body)return false;
  useLeftBehindStore.setState({machinesVisible:true,menuOpen:false});
  useCosmosStore.setState({showQuickJump:false});
  useCosmosStore.getState().setSelectedObject(body);
  const started=Date.now();
  pending=setInterval(()=>{
    if(landedPins.has(id)){clearInterval(pending!);pending=null;select(id,distanceKm);}
    else if(Date.now()-started>60000){clearInterval(pending!);pending=null;}
  },250);
  return true;
}
