// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { getHardware } from '../data/dataClient';
import type { Trajectory } from '../data/types';
import { loadTrajectory } from '../engine/trajectory';
import { HardwareTrack } from './HardwareTrack';
import { SurfacePins } from './SurfacePins';
import { useCosmosStore } from '@/components/cosmos/store/useCosmosStore';
export function LeftBehindLayer() {
  const [tracks,setTracks]=useState<Trajectory[]>([]);
  const [nearest,setNearest]=useState<string[]>([]);
  const lastNearestUpdate=useRef(-1);
  useEffect(()=> {
    let cancelled=false;
    void getHardware().then(async h=> {
      const results=await Promise.allSettled(h.machines.flatMap(m=>m.trajectories.map(t=>loadTrajectory(t.id))));
      if(!cancelled)setTracks(results.flatMap(r=>r.status==='fulfilled'?[r.value]:[]));
      for(const r of results)if(r.status==='rejected')console.warn('TODO(source): trajectory unavailable');
    }).catch(()=>console.warn('TODO(source): hardware unavailable'));
    return ()=>{cancelled=true;};
  },[]);
  useFrame(({camera,clock})=> {
    if(clock.elapsedTime-lastNearestUpdate.current<.5)return;
    lastNearestUpdate.current=clock.elapsedTime;
    const positions=useCosmosStore.getState().objectWorldPositions;
    const ids=tracks.filter(t=>positions[`hw:${t.id}`]).sort((a,b)=> {
      const distance=(id:string)=>{const p=positions[`hw:${id}`];return p?Math.hypot(p[0]-camera.position.x,p[1]-camera.position.y,p[2]-camera.position.z):Infinity;};
      return distance(a.id)-distance(b.id);
    }).slice(0,2).map(t=>t.id);
    setNearest(old=>old.join()===ids.join()?old:ids);
  });
  return <group name="left-behind-layer">{tracks.map(data=><HardwareTrack key={data.id} data={data} nearest={nearest.includes(data.id)}/>)}<SurfacePins/></group>;
}
