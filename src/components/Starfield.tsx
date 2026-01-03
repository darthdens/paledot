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

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  life: number;
  maxLife: number;
}

export const Starfield = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);
  const lastShootingStarRef = useRef(0);

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

    const createShootingStar = () => {
      // Random starting position - typically from upper area
      const startX = Math.random() * canvas.width;
      const startY = Math.random() * (canvas.height * 0.4);
      
      // Angle between 20-60 degrees (going down-right mostly)
      const angle = (Math.random() * 40 + 20) * (Math.PI / 180);
      
      shootingStarsRef.current.push({
        x: startX,
        y: startY,
        length: Math.random() * 80 + 60,
        speed: Math.random() * 8 + 6,
        angle: Math.random() > 0.5 ? angle : Math.PI - angle, // Sometimes go left
        opacity: 1,
        life: 0,
        maxLife: Math.random() * 60 + 40,
      });
    };

    const animate = (timestamp: number) => {
      if (!ctx || !canvas) return;
      
      timeRef.current = timestamp;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const isDark = document.documentElement.classList.contains("dark");
      const starColor = isDark ? "255, 255, 255" : "0, 0, 0";
      
      // Draw regular stars
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

      // Spawn new shooting star occasionally (every 3-6 seconds on average)
      if (timestamp - lastShootingStarRef.current > 3000 && Math.random() < 0.02) {
        createShootingStar();
        lastShootingStarRef.current = timestamp;
      }

      // Draw and update shooting stars
      shootingStarsRef.current = shootingStarsRef.current.filter((star) => {
        star.life++;
        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;
        
        // Fade out as life progresses
        const lifeProgress = star.life / star.maxLife;
        star.opacity = 1 - lifeProgress;
        
        if (star.opacity <= 0) return false;
        
        // Draw shooting star trail
        const tailX = star.x - Math.cos(star.angle) * star.length;
        const tailY = star.y - Math.sin(star.angle) * star.length;
        
        // Create gradient for the trail
        const gradient = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
        gradient.addColorStop(0, `rgba(${starColor}, 0)`);
        gradient.addColorStop(0.7, `rgba(${starColor}, ${star.opacity * 0.5})`);
        gradient.addColorStop(1, `rgba(${starColor}, ${star.opacity})`);
        
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(star.x, star.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.stroke();
        
        // Draw bright head
        const headGradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, 4);
        headGradient.addColorStop(0, `rgba(${starColor}, ${star.opacity})`);
        headGradient.addColorStop(1, `rgba(${starColor}, 0)`);
        
        ctx.beginPath();
        ctx.arc(star.x, star.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = headGradient;
        ctx.fill();
        
        return true;
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