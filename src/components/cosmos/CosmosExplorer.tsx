import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';
import { Earth } from './objects/Earth';
import { Sun } from './objects/Sun';
import { CosmosUI } from './ui/CosmosUI';

export const CosmosExplorer = () => {
  return (
    <div className="relative w-full h-full cursor-default" style={{ cursor: 'default' }}>
      <Canvas>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 10000, 50000]} fov={60} near={1} far={1e15} />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            zoomSpeed={1.5}
            panSpeed={0.8}
            rotateSpeed={0.5}
            minDistance={100}
            maxDistance={1e14}
          />
          
          {/* Ambient and directional lighting */}
          <ambientLight intensity={0.1} />
          <directionalLight position={[-1e8, 0, 0]} intensity={1.5} />
          
          {/* Star background */}
          <Stars radius={1e12} depth={1e11} count={10000} factor={1e9} saturation={0} fade speed={0.5} />
          
          {/* Celestial objects */}
          <Earth />
          <Sun position={[-1.496e8, 0, 0]} scale={0.001} />
        </Suspense>
      </Canvas>
      
      {/* UI Overlay */}
      <CosmosUI />
    </div>
  );
};
