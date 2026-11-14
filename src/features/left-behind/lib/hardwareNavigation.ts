// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useCosmosStore } from '@/components/cosmos/store/useCosmosStore';
import { useLeftBehindStore } from '../state/useLeftBehindStore';
import { positionAt } from '../engine/trajectory';
import { useSimClock } from '../state/useSimClock';
import { landedPins } from './pinRegistry';
export function canFollowHardware(id:string,date=useSimClock.getState().simDate){return positionAt(id,new Date(date))!==null||landedPins.has(id);}
// Landed Moon/Mars machines have no flight position any more; their surface pin makes them followable.
export function followHardware(id:string){
  if(!canFollowHardware(id))return false;
  useCosmosStore.getState().setSelectedObject(null);
  useCosmosStore.setState({showQuickJump:false});
  useLeftBehindStore.setState({machinesVisible:true,menuOpen:false});
  useLeftBehindStore.getState().selectHardware(id);
  return true;
}