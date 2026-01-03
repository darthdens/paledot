import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  opacity: number;
  phase: number;
  driftSpeed: number;
  twinkleSpeed: number;
}

export const Starfield = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      // Create a grid-based distribution for evenness
      const cols = Math.ceil(canvas.width / 80);
      const rows = Math.ceil(canvas.height / 80);
      const cellWidth = canvas.width / cols;
      const cellHeight = canvas.height / rows;
      
      particlesRef.current = [];
      
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          // Add some randomness within each cell
          const x = i * cellWidth + Math.random() * cellWidth;
          const y = j * cellHeight + Math.random() * cellHeight;
          
          particlesRef.current.push({
            x,
            y,
            baseX: x,
            baseY: y,
            size: Math.random() * 1.5 + 0.4,
            opacity: Math.random() * 0.5 + 0.15,
            phase: Math.random() * Math.PI * 2,
            driftSpeed: Math.random() * 0.0008 + 0.0003,
            twinkleSpeed: Math.random() * 0.002 + 0.001,
          });
        }
      }
    };

    const animate = (timestamp: number) => {
      if (!ctx || !canvas) return;
      
      timeRef.current = timestamp;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const isDark = document.documentElement.classList.contains("dark");
      const starColor = isDark ? "255, 255, 255" : "0, 0, 0";
      
      particlesRef.current.forEach((particle) => {
        // Smooth continuous drift
        const driftX = Math.sin(timestamp * particle.driftSpeed + particle.phase) * 40;
        const driftY = Math.cos(timestamp * particle.driftSpeed * 0.8 + particle.phase * 1.3) * 30;
        
        // Smooth twinkle
        const twinkle = (Math.sin(timestamp * particle.twinkleSpeed + particle.phase) + 1) / 2;
        const currentOpacity = particle.opacity * (0.3 + twinkle * 0.7);
        
        const x = particle.baseX + driftX;
        const y = particle.baseY + driftY;
        
        // Draw soft glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, particle.size * 2);
        gradient.addColorStop(0, `rgba(${starColor}, ${currentOpacity})`);
        gradient.addColorStop(1, `rgba(${starColor}, 0)`);
        
        ctx.beginPath();
        ctx.arc(x, y, particle.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw core
        ctx.beginPath();
        ctx.arc(x, y, particle.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${starColor}, ${currentOpacity * 1.5})`;
        ctx.fill();
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.5 }}
    />
  );
};
