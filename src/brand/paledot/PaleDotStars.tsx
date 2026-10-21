import { useEffect, useRef } from "react";

/** Sparse, dim, procedural starfield. Never brighter than the dot. */
export function PaleDotStars({ density = 2600, seed = 7 }: { density?: number; seed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr); ctx.clearRect(0, 0, w, h);
      let s = seed;
      const rnd = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
      const n = Math.floor((w * h) / density);
      for (let i = 0; i < n; i++) {
        const x = rnd() * w, y = rnd() * h, t = rnd();
        const r = 0.45 + 0.55 * t ** 3 + (rnd() < 0.03 ? 0.9 : 0);
        const a = (0.12 + 0.62 * t ** 2.2) * (r > 1.3 ? 0.75 : 1);
        ctx.fillStyle = rnd() < 0.8 ? `rgba(220,233,245,${a.toFixed(2)})` : `rgba(201,229,248,${a.toFixed(2)})`;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [density, seed]);
  return <canvas ref={ref} className="pd-stars" aria-hidden="true" />;
}
