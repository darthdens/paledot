// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { Component,Suspense,useMemo } from 'react';
import type { ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls,useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Dialog,DialogContent,DialogTitle,DialogDescription } from '@/components/ui/dialog';
import { useLanguage } from '@/i18n/LanguageContext';
import { machineCopy } from '../lib/machineCopy';
import voyager from '../assets/voyager.glb.asset.json';
import ingenuity from '../assets/ingenuity.glb.asset.json';
import opportunity from '../assets/opportunity.glb.asset.json';
import viking from '../assets/viking.glb.asset.json';
import apollo from '../assets/apollo.glb.asset.json';
const models:Record<string,{url:string}>= {'voyager-1':voyager,'voyager-2':voyager,ingenuity,opportunity,'viking-1':viking,'apollo-11':apollo};
export function hasNasaModel(id:string){return !!models[id];}
class ModelBoundary extends Component<{children:ReactNode;fallback:ReactNode},{failed:boolean}>{
  override state={failed:false};static getDerivedStateFromError(){return {failed:true};}
  override render(){return this.state.failed?this.props.fallback:this.props.children;}
}
function Model({url}:{url:string}){
  const {scene}=useGLTF(url,false);
  const normalized=useMemo(()=>{
    const clone=scene.clone(true);const bounds=new THREE.Box3().setFromObject(clone);
    const center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
    const scale=3/Math.max(size.x,size.y,size.z);clone.position.copy(center).multiplyScalar(-scale);clone.scale.setScalar(scale);
    return clone;
  },[scene]);
  return <primitive object={normalized}/>;
}
export function NasaModelInspector({id,onClose}:{id:string;onClose:()=>void}){
  const {language}=useLanguage();const copy=machineCopy[language];const model=models[id];
  if(!model)return null;
  return <Dialog open onOpenChange={open=>{if(!open)onClose();}}><DialogContent className="paledot dark pd-nasa-inspector rounded-lg border-border bg-background text-foreground w-[calc(100vw-2rem)] max-w-3xl p-4 sm:p-6 z-[30000]">
    <DialogTitle>{id.replaceAll('-',' ').toUpperCase()}</DialogTitle><DialogDescription>{copy.inspection}</DialogDescription>
    <div className="aspect-[4/3] min-h-0 max-h-[60dvh]" data-nasa-model>
      <ModelBoundary fallback={<p>{copy.unavailable}</p>}><Canvas camera={{position:[0,0,5],fov:45}} dpr={1}>
        <ambientLight intensity={1.3}/><directionalLight position={[3,4,5]} intensity={2}/><directionalLight position={[-3,0,-2]} intensity={1}/>
        <Suspense fallback={null}><Model url={model.url}/></Suspense><OrbitControls makeDefault minDistance={2} maxDistance={12} enablePan={false}/>
      </Canvas></ModelBoundary>
    </div><a className="text-xs text-muted-foreground underline" href="https://github.com/nasa/NASA-3D-Resources" target="_blank" rel="noopener noreferrer">{copy.modelCredit}</a>
  </DialogContent></Dialog>;
}