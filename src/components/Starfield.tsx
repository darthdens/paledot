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

interface NebulaCloud {
  offsetX: number;
  offsetY: number;
  radius: number;
  color: string;
}

interface Nebula {
  x: number;
  y: number;
  clouds: NebulaCloud[];
  rotation: number;
  opacity: number;
  phase: number;
  driftSpeed: number;
}

interface Galaxy {
  x: number;
  y: number;
  size: number;
  rotation: number;
  arms: number;
  opacity: number;
  rotationSpeed: number;
}


export const Starfield = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const nebulasRef = useRef<Nebula[]>([]);
  const galaxiesRef = useRef<Galaxy[]>([]);
  
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
      initNebulas();
      initGalaxies();
      
    };

    const initParticles = () => {
      const cols = Math.ceil(canvas.width / 80);
      const rows = Math.ceil(canvas.height / 80);
      const cellWidth = canvas.width / cols;
      const cellHeight = canvas.height / rows;
      
      particlesRef.current = [];
      
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
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

    const initNebulas = () => {
      const nebulaColorPalettes = [
        ["255, 100, 180", "180, 50, 255", "100, 150, 255"], // Pink-purple-blue
        ["255, 150, 100", "255, 80, 120", "200, 100, 255"], // Orange-pink-purple
        ["100, 200, 255", "150, 100, 255", "200, 150, 255"], // Cyan-purple
        ["255, 200, 100", "255, 120, 80", "255, 80, 150"],  // Gold-orange-pink
      ];
      
      nebulasRef.current = [];
      const nebulaCount = Math.floor(Math.random() * 2) + 2; // 2-3 nebulas
      
      for (let i = 0; i < nebulaCount; i++) {
        const palette = nebulaColorPalettes[Math.floor(Math.random() * nebulaColorPalettes.length)];
        const cloudCount = Math.floor(Math.random() * 8) + 12; // 12-20 clouds per nebula
        const clouds: NebulaCloud[] = [];
        
        for (let c = 0; c < cloudCount; c++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * 120 + 30;
          clouds.push({
            offsetX: Math.cos(angle) * distance,
            offsetY: Math.sin(angle) * distance * 0.6,
            radius: Math.random() * 80 + 40,
            color: palette[Math.floor(Math.random() * palette.length)],
          });
        }
        
        nebulasRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          clouds,
          rotation: Math.random() * Math.PI * 2,
          opacity: Math.random() * 0.12 + 0.06,
          phase: Math.random() * Math.PI * 2,
          driftSpeed: Math.random() * 0.0002 + 0.0001,
        });
      }
    };

    const initGalaxies = () => {
      galaxiesRef.current = [];
      const galaxyCount = Math.floor(Math.random() * 2) + 2; // 2-3 galaxies
      
      for (let i = 0; i < galaxyCount; i++) {
        galaxiesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 30 + 20,
          rotation: Math.random() * Math.PI * 2,
          arms: Math.random() > 0.5 ? 2 : 3,
          opacity: Math.random() * 0.15 + 0.08,
          rotationSpeed: (Math.random() * 0.0001 + 0.00005) * (Math.random() > 0.5 ? 1 : -1),
        });
      }
    };


    const createShootingStar = () => {
      const startX = Math.random() * canvas.width;
      const startY = Math.random() * (canvas.height * 0.4);
      const angle = (Math.random() * 40 + 20) * (Math.PI / 180);
      
      shootingStarsRef.current.push({
        x: startX,
        y: startY,
        length: Math.random() * 80 + 60,
        speed: Math.random() * 8 + 6,
        angle: Math.random() > 0.5 ? angle : Math.PI - angle,
        opacity: 1,
        life: 0,
        maxLife: Math.random() * 60 + 40,
      });
    };

    const drawNebula = (ctx: CanvasRenderingContext2D, nebula: Nebula, timestamp: number, isDark: boolean) => {
      const drift = Math.sin(timestamp * nebula.driftSpeed + nebula.phase) * 20;
      const x = nebula.x + drift;
      const y = nebula.y + Math.cos(timestamp * nebula.driftSpeed * 0.7 + nebula.phase) * 15;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(nebula.rotation);
      ctx.globalCompositeOperation = "screen";
      
      // Draw each cloud with multiple layers for wispy effect
      nebula.clouds.forEach((cloud, index) => {
        const cloudDrift = Math.sin(timestamp * 0.0003 + index) * 10;
        const cloudX = cloud.offsetX + cloudDrift;
        const cloudY = cloud.offsetY + Math.cos(timestamp * 0.0002 + index * 0.5) * 8;
        
        // Multiple soft layers per cloud
        for (let layer = 0; layer < 4; layer++) {
          const layerScale = 1 - layer * 0.15;
          const layerOpacity = nebula.opacity * (1 - layer * 0.2) * (isDark ? 1 : 0.4);
          
          const gradient = ctx.createRadialGradient(
            cloudX, cloudY, 0,
            cloudX, cloudY, cloud.radius * layerScale
          );
          
          gradient.addColorStop(0, `rgba(${cloud.color}, ${layerOpacity * 0.6})`);
          gradient.addColorStop(0.3, `rgba(${cloud.color}, ${layerOpacity * 0.4})`);
          gradient.addColorStop(0.6, `rgba(${cloud.color}, ${layerOpacity * 0.15})`);
          gradient.addColorStop(1, `rgba(${cloud.color}, 0)`);
          
          ctx.beginPath();
          ctx.arc(cloudX, cloudY, cloud.radius * layerScale, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }
      });
      
      // Add some bright spots (stars within nebula)
      for (let i = 0; i < 5; i++) {
        const starX = nebula.clouds[i % nebula.clouds.length].offsetX * 0.5;
        const starY = nebula.clouds[i % nebula.clouds.length].offsetY * 0.5;
        const starGlow = ctx.createRadialGradient(starX, starY, 0, starX, starY, 15);
        const starOpacity = nebula.opacity * (isDark ? 2 : 0.8);
        
        starGlow.addColorStop(0, `rgba(255, 255, 255, ${starOpacity})`);
        starGlow.addColorStop(0.3, `rgba(255, 255, 255, ${starOpacity * 0.3})`);
        starGlow.addColorStop(1, `rgba(255, 255, 255, 0)`);
        
        ctx.beginPath();
        ctx.arc(starX, starY, 15, 0, Math.PI * 2);
        ctx.fillStyle = starGlow;
        ctx.fill();
      }
      
      ctx.restore();
    };

    const drawGalaxy = (ctx: CanvasRenderingContext2D, galaxy: Galaxy, timestamp: number, starColor: string) => {
      ctx.save();
      ctx.translate(galaxy.x, galaxy.y);
      ctx.rotate(galaxy.rotation + timestamp * galaxy.rotationSpeed);
      
      // Draw galaxy core
      const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, galaxy.size * 0.3);
      coreGradient.addColorStop(0, `rgba(${starColor}, ${galaxy.opacity * 1.5})`);
      coreGradient.addColorStop(1, `rgba(${starColor}, 0)`);
      
      ctx.beginPath();
      ctx.arc(0, 0, galaxy.size * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();
      
      // Draw spiral arms
      for (let arm = 0; arm < galaxy.arms; arm++) {
        const armAngle = (arm / galaxy.arms) * Math.PI * 2;
        
        for (let i = 0; i < 30; i++) {
          const distance = (i / 30) * galaxy.size;
          const spiralAngle = armAngle + (i / 30) * Math.PI * 1.5;
          const x = Math.cos(spiralAngle) * distance;
          const y = Math.sin(spiralAngle) * distance * 0.4; // Flatten for perspective
          const starSize = (1 - i / 30) * 1.5 + 0.3;
          const starOpacity = galaxy.opacity * (1 - i / 40);
          
          ctx.beginPath();
          ctx.arc(x, y, starSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${starColor}, ${starOpacity})`;
          ctx.fill();
        }
      }
      
      ctx.restore();
    };


    const animate = (timestamp: number) => {
      if (!ctx || !canvas) return;
      
      timeRef.current = timestamp;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const isDark = document.documentElement.classList.contains("dark");
      const starColor = isDark ? "255, 255, 255" : "0, 0, 0";
      
      // Draw nebulas first (background layer)
      nebulasRef.current.forEach((nebula) => {
        drawNebula(ctx, nebula, timestamp, isDark);
      });
      
      // Draw galaxies
      galaxiesRef.current.forEach((galaxy) => {
        drawGalaxy(ctx, galaxy, timestamp, starColor);
      });
      
      
      // Draw regular stars
      particlesRef.current.forEach((particle) => {
        const driftX = Math.sin(timestamp * particle.driftSpeed + particle.phase) * 40;
        const driftY = Math.cos(timestamp * particle.driftSpeed * 0.8 + particle.phase * 1.3) * 30;
        const twinkle = (Math.sin(timestamp * particle.twinkleSpeed + particle.phase) + 1) / 2;
        const currentOpacity = particle.opacity * (0.3 + twinkle * 0.7);
        
        const x = particle.baseX + driftX;
        const y = particle.baseY + driftY;
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, particle.size * 2);
        gradient.addColorStop(0, `rgba(${starColor}, ${currentOpacity})`);
        gradient.addColorStop(1, `rgba(${starColor}, 0)`);
        
        ctx.beginPath();
        ctx.arc(x, y, particle.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x, y, particle.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${starColor}, ${currentOpacity * 1.5})`;
        ctx.fill();
      });

      // Spawn shooting stars
      if (timestamp - lastShootingStarRef.current > 3000 && Math.random() < 0.02) {
        createShootingStar();
        lastShootingStarRef.current = timestamp;
      }

      // Draw shooting stars
      shootingStarsRef.current = shootingStarsRef.current.filter((star) => {
        star.life++;
        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;
        
        const lifeProgress = star.life / star.maxLife;
        star.opacity = 1 - lifeProgress;
        
        if (star.opacity <= 0) return false;
        
        const tailX = star.x - Math.cos(star.angle) * star.length;
        const tailY = star.y - Math.sin(star.angle) * star.length;
        
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
