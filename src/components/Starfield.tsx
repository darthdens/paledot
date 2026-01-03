import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
}

export const Starfield = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = document.documentElement.scrollHeight;
      initStars();
    };

    const initStars = () => {
      const starCount = Math.floor((canvas.width * canvas.height) / 15000);
      starsRef.current = [];
      
      for (let i = 0; i < starCount; i++) {
        starsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.5 + 0.1,
          speed: Math.random() * 0.5 + 0.1,
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY + window.scrollY };
    };

    const animate = () => {
      if (!ctx || !canvas) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Get computed styles to check theme
      const isDark = document.documentElement.classList.contains("dark");
      const starColor = isDark ? "255, 255, 255" : "0, 0, 0";
      
      starsRef.current.forEach((star) => {
        // Subtle twinkle effect
        const twinkle = Math.sin(Date.now() * 0.001 * star.speed + star.x) * 0.3 + 0.7;
        
        // Very subtle mouse interaction
        const dx = mouseRef.current.x - star.x;
        const dy = mouseRef.current.y - star.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 150;
        
        let offsetX = 0;
        let offsetY = 0;
        
        if (distance < maxDistance) {
          const force = (1 - distance / maxDistance) * 0.3;
          offsetX = -dx * force * 0.02;
          offsetY = -dy * force * 0.02;
        }
        
        ctx.beginPath();
        ctx.arc(
          star.x + offsetX,
          star.y + offsetY,
          star.size,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(${starColor}, ${star.opacity * twinkle})`;
        ctx.fill();
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", handleMouseMove);
    
    // Re-init on scroll height change (for dynamic content)
    const resizeObserver = new ResizeObserver(() => {
      if (canvas.height !== document.documentElement.scrollHeight) {
        resizeCanvas();
      }
    });
    resizeObserver.observe(document.body);
    
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      resizeObserver.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
};
