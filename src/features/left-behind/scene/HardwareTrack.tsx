// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect, useMemo, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCosmosStore } from '@/components/cosmos/store/useCosmosStore';
import { useLeftBehindStore } from '../state/useLeftBehindStore';
import { useSimClock } from '../state/useSimClock';
import { positionAt, sampleTrajectory } from '../engine/trajectory';
import type { Trajectory } from '../data/types';
import { eclipticKmToScene } from '../lib/units';
import { machineCopy } from '../lib/machineCopy';

export function HardwareTrack({ data, nearest }: { data: Trajectory; nearest: boolean }) {
  const marker = useRef<THREE.Group>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const selected = useLeftBehindStore(s=>s.selectedHardwareId===data.id);
  const full = useLeftBehindStore(s=>s.fullPathsVisible);
  const { language } = useLanguage();
  const world = useMemo(()=>new THREE.Vector3(),[]);
  const graphics = useMemo(()=> {
    const skin = document.querySelector('.paledot');
    const style = skin ? getComputedStyle(skin) : null;
    const color = new THREE.Color(`hsl(${style?.getPropertyValue('--foreground').trim() || '220 14% 77%'})`);
    const samples = sampleTrajectory(data);
    // Break lines at missing intervals: no invented bridges across Horizons gaps.
    const chunks: typeof samples[] = [];
    for (const point of samples) {
      const lastChunk=chunks[chunks.length-1], previous=lastChunk?.[lastChunk.length-1];
      if (!lastChunk || (previous && !positionAt(data.id,new Date((previous.time+point.time)/2)))) chunks.push([point]);
      else lastChunk.push(point);
    }
    return chunks.map(points=> {
      const geometry=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...eclipticKmToScene(...p.km))));
      const future=new THREE.Line(geometry.clone(),new THREE.LineDashedMaterial({color,transparent:true,opacity:.12,dashSize:10000,gapSize:10000,depthWrite:false}));
      future.computeLineDistances(); future.frustumCulled=false;
      const past=new THREE.Line(geometry,new THREE.LineBasicMaterial({color,transparent:true,opacity:.45,linewidth:1,depthWrite:false}));
      past.frustumCulled=false;
      return { points,past,future };
    });
  },[data]);
  const tip = useMemo(()=> {
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));
    const material=new THREE.LineBasicMaterial({transparent:true,opacity:.45,depthWrite:false});
    const first=graphics[0];if(first)material.color.copy(first.past.material.color);
    const line=new THREE.Line(geometry,material);
    line.frustumCulled=false;
    return line;
  },[graphics]);
  useEffect(()=>()=>{tip.geometry.dispose();tip.material.dispose();},[tip]);
  useEffect(()=>()=>{ for(const g of graphics){g.past.geometry.dispose();g.past.material.dispose();g.future.geometry.dispose();g.future.material.dispose();} delete useCosmosStore.getState().objectWorldPositions[`hw:${data.id}`]; },[graphics,data.id]);
  useFrame(()=> {
    const time=useSimClock.getState().simDate;
    for(const g of graphics) {
      let low=0,high=g.points.length;
      while(low<high){const middle=(low+high)>>>1;if((g.points[middle]?.time ?? Infinity)<=time)low=middle+1;else high=middle;}
      g.past.geometry.setDrawRange(0,low);
      g.future.visible=full;
      g.future.geometry.setDrawRange(Math.max(0,low-1),g.points.length-Math.max(0,low-1));
    }
    const node=marker.current;if(!node)return;
    const p=positionAt(data.id,new Date(time)); node.visible=!!p;
    tip.visible=false;
    if(anchor.current)anchor.current.hidden=!p;
    if (!p) { delete useCosmosStore.getState().objectWorldPositions[`hw:${data.id}`]; return; }
    node.position.set(...eclipticKmToScene(...p.km));
    const chunk=[...graphics].reverse().find(g=>(g.points[0]?.time ?? Infinity)<=time);
    const last=chunk?.points.filter(point=>point.time<=time).at(-1);
    if(last && positionAt(data.id,new Date((last.time+time)/2))) {
      const a=eclipticKmToScene(...last.km),b=eclipticKmToScene(...p.km);
      const attribute=tip.geometry.getAttribute('position');attribute.setXYZ(0,...a);attribute.setXYZ(1,...b);attribute.needsUpdate=true;tip.visible=true;
    }
    node.updateWorldMatrix(true,false);node.getWorldPosition(world);
    useCosmosStore.getState().setObjectWorldPosition(`hw:${data.id}`,[world.x,world.y,world.z]);
  },-0.25);
  const label=data.id.replaceAll('-',' ').toUpperCase();
  return <group name={`hardware-track-${data.id}`}>
    <primitive object={tip}/>
    {graphics.map((g,i)=><group key={i}><primitive object={g.past}/><primitive object={g.future}/></group>)}
    <group ref={marker} visible={false} name={`hw:${data.id}`}>
      <Html center zIndexRange={[40,30]}>
        <div ref={anchor} hidden className="paledot dark pd-hardware-anchor" onPointerEnter={()=>setHover(true)} onPointerLeave={()=>setHover(false)}>
          <Button variant="ghost" className="pd-hardware-hit" aria-label={`${machineCopy[language].select} ${label}`} aria-pressed={selected} onClick={()=>{useCosmosStore.getState().setSelectedObject(null);useLeftBehindStore.getState().selectHardware(data.id);}}>
            <span className={`pd-hardware-ring ${selected?'pd-hardware-selected':''}`} />
          </Button>
          {(hover||selected||nearest)&&<span className="pd-hardware-label">{label}{data.source==='simplified'&&<small>{machineCopy[language].simplified}</small>}</span>}
        </div>
      </Html>
    </group>
  </group>;
}