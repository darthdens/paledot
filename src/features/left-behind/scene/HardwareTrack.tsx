// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
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
import { followHardware } from '../lib/hardwareNavigation';
import { machineCopy } from '../lib/machineCopy';
import { nasaModels } from '../lib/nasaModels';
import { HardwareModel } from './HardwareModel';
import { trueSpanUnits } from '../lib/nasaModels';

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  // A model failure falls back to the ring marker; the universe keeps running.
  override render() { return this.state.failed ? null : this.props.children; }
}
const PARENTS: Record<string, 'moon' | 'mars'> = { 'apollo-11': 'moon', 'apollo-15': 'moon', 'apollo-16': 'moon', 'apollo-17': 'moon', 'viking-1': 'mars', opportunity: 'mars', ingenuity: 'mars' };

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
      const origin=eclipticKmToScene(...(points[0]?.km ?? [0,0,0]));
      // Local origins retain metre-level precision far beyond the outer planets.
      const geometry=new THREE.BufferGeometry().setFromPoints(points.map(p=>{const v=eclipticKmToScene(...p.km);return new THREE.Vector3(v[0]-origin[0],v[1]-origin[1],v[2]-origin[2]);}));
      const future=new THREE.Line(geometry.clone(),new THREE.LineDashedMaterial({color,transparent:true,opacity:.3,dashSize:10000,gapSize:10000,depthWrite:false,depthTest:false}));
      future.computeLineDistances(); future.frustumCulled=false;future.position.set(...origin);future.renderOrder=2;
      const past=new THREE.Line(geometry,new THREE.LineBasicMaterial({color,transparent:true,opacity:.45,linewidth:1,depthWrite:false,depthTest:false}));
      past.frustumCulled=false;past.position.set(...origin);past.renderOrder=1;
      const scene=new Float64Array(points.length*3);
      points.forEach((pt,i)=>{const v=eclipticKmToScene(...pt.km);scene[i*3]=v[0];scene[i*3+1]=v[1];scene[i*3+2]=v[2];});
      return { points,past,future,scene };
    });
  },[data]);
  const tip = useMemo(()=> {
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));
    const material=new THREE.LineBasicMaterial({transparent:true,opacity:.45,depthWrite:false,depthTest:false});
    const first=graphics[0];if(first)material.color.copy(first.past.material.color);
    const line=new THREE.Line(geometry,material);
    line.frustumCulled=false;
    return line;
  },[graphics]);
  useEffect(()=>()=>{tip.geometry.dispose();tip.material.dispose();},[tip]);
  useEffect(()=>()=>{ for(const g of graphics){g.past.geometry.dispose();g.past.material.dispose();g.future.geometry.dispose();g.future.material.dispose();} delete useCosmosStore.getState().objectWorldPositions[`hw:${data.id}`]; },[graphics,data.id]);
  useFrame(({camera,size})=> {
    const time=useSimClock.getState().simDate;
    const trails=useCosmosStore.getState().showTrails;
    for(const g of graphics) {
      g.past.visible=trails;
      let low=0,high=g.points.length;
      while(low<high){const middle=(low+high)>>>1;if((g.points[middle]?.time ?? Infinity)<=time)low=middle+1;else high=middle;}
      g.past.geometry.setDrawRange(0,low);
      g.future.visible=full&&trails;
      g.future.geometry.setDrawRange(Math.max(0,low-1),g.points.length-Math.max(0,low-1));
    }
    const node=marker.current;if(!node)return;
    const p=positionAt(data.id,new Date(time)); node.visible=!!p;
    tip.visible=false;
    if(anchor.current)anchor.current.hidden=!p;
    if (!p) { delete useCosmosStore.getState().objectWorldPositions[`hw:${data.id}`]; return; }
    const here=eclipticKmToScene(...p.km);
    node.position.set(...here);
    // Re-centre path vertices on the machine every frame: Float32 vertices millions of units from
    // their origin jitter by kilometres, which flickers at metre-scale zoom.
    for(const g of graphics){
      for(const line of [g.past,g.future]){
        const attr=line.geometry.getAttribute('position') as THREE.BufferAttribute;const arr=attr.array as Float32Array;
        for(let i=0;i<arr.length;i++)arr[i]=(g.scene[i] ?? 0)-(here[i%3] ?? 0);
        attr.needsUpdate=true;line.position.set(...here);
      }
    }
    const chunk=[...graphics].reverse().find(g=>(g.points[0]?.time ?? Infinity)<=time);
    const last=chunk?.points.filter(point=>point.time<=time).at(-1);
    if(last && positionAt(data.id,new Date((last.time+time)/2))) {
      const a=eclipticKmToScene(...last.km),b=here;tip.position.set(...b);
      const attribute=tip.geometry.getAttribute('position');attribute.setXYZ(0,a[0]-b[0],a[1]-b[1],a[2]-b[2]);attribute.setXYZ(1,0,0,0);attribute.needsUpdate=true;tip.visible=trails;
    }
    node.updateWorldMatrix(true,false);node.getWorldPosition(world);
    // Hide the ring once the true-size model is bigger on screen than the ring itself.
    const span=trueSpanUnits.get(data.id);
    if(anchor.current&&span){const cam=camera as THREE.PerspectiveCamera;const px=span/(2*cam.position.distanceTo(world)*Math.tan(THREE.MathUtils.degToRad((cam.fov??60)/2)))*size.height;anchor.current.hidden=px>18;anchor.current.style.visibility=px>18?"hidden":"";}
    useCosmosStore.getState().setObjectWorldPosition(`hw:${data.id}`,[world.x,world.y,world.z]);
  },-0.25);
  const model=nasaModels[data.id];
  const label=data.id.replaceAll('-',' ').toUpperCase();
  return <group name={`hardware-track-${data.id}`}>
    <primitive object={tip}/>
    {graphics.map((g,i)=><group key={i}><primitive object={g.past}/><primitive object={g.future}/></group>)}
    <group ref={marker} visible={false} name={`hw:${data.id}`}>
      {model&&<SceneBoundary><Suspense fallback={null}><HardwareModel id={data.id} url={model.url} selected={selected} parent={PARENTS[data.id]}/></Suspense></SceneBoundary>}
      <Html center zIndexRange={[40,30]}>
        <div ref={anchor} hidden className="paledot dark pd-hardware-anchor" onPointerEnter={()=>setHover(true)} onPointerLeave={()=>setHover(false)}>
          <Button variant="ghost" className="pd-hardware-hit" aria-label={`${machineCopy[language].select} ${label}`} aria-pressed={selected} onClick={()=>followHardware(data.id)}>
            <span className={`pd-hardware-ring ${selected?'pd-hardware-selected':''} ${model?'pd-hardware-ring-model':''}`} />
          </Button>
          {(hover||selected||nearest)&&<span className="pd-hardware-label">{label}{data.source==='simplified'&&<small>{machineCopy[language].simplified}</small>}</span>}
        </div>
      </Html>
    </group>
  </group>;
}