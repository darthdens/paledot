import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useRef, useState } from 'react';

export const PerformanceHUD = () => {
  const { gl } = useThree();
  const [stats, setStats] = useState({ fps: 0, drawCalls: 0, triangles: 0 });
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useFrame(() => {
    frameCount.current++;
    const now = performance.now();
    const elapsed = now - lastTime.current;

    // Update every 500ms
    if (elapsed >= 500) {
      const fps = Math.round((frameCount.current / elapsed) * 1000);
      const info = gl.info;
      
      setStats({
        fps,
        drawCalls: info.render.calls,
        triangles: info.render.triangles,
      });

      frameCount.current = 0;
      lastTime.current = now;
    }
  });

  return (
    <Html
      position={[0, 0, 0]}
      style={{
        position: 'fixed',
        top: 12,
        left: 12,
        pointerEvents: 'none',
      }}
      zIndexRange={[100, 0]}
    >
      <div className="bg-background/80 backdrop-blur-sm border border-border rounded-lg px-3 py-2 font-mono text-xs text-foreground shadow-lg">
        <div className="flex flex-col gap-0.5">
          <span className={stats.fps < 30 ? 'text-destructive' : stats.fps < 50 ? 'text-yellow-500' : 'text-green-500'}>
            FPS: {stats.fps}
          </span>
          <span>Draw calls: {stats.drawCalls}</span>
          <span>Triangles: {stats.triangles.toLocaleString()}</span>
        </div>
      </div>
    </Html>
  );
};
