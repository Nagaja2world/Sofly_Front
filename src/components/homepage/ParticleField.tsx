import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  drift: number;
  driftSpeed: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  shape: "petal" | "circle" | "leaf";
  opacity: number;
}

interface Props {
  /** 캔버스 안 떠다닐 파티클 개수 */
  count?: number;
  /** 부모 요소 기준 절대 위치 캔버스 (true) / 화면 고정 (false) */
  absolute?: boolean;
}

const PALETTE = [
  "#F8C7D8", // 연분홍
  "#FFE9A8", // 연노랑
  "#FBD8A2", // 살구
  "#D6E8DC", // 연민트
  "#CCE3F2", // 연하늘
  "#FFFFFF", // 화이트 (구름)
];

/**
 * Canvas 위에 떠다니는 작은 파티클(꽃잎/잎/구름점).
 * 마우스 근처에선 살짝 밀려나는 인터랙션 포함.
 */
export default function ParticleField({ count = 38, absolute = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const { width, height } = parent.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    const initParticles = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const { width, height } = parent.getBoundingClientRect();
      particlesRef.current = Array.from({ length: count }).map(() => {
        const shapes: Particle["shape"][] = ["petal", "circle", "leaf"];
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          size: 4 + Math.random() * 8,
          speedY: 0.2 + Math.random() * 0.6,
          speedX: -0.3 + Math.random() * 0.6,
          drift: Math.random() * Math.PI * 2,
          driftSpeed: 0.01 + Math.random() * 0.02,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: -0.02 + Math.random() * 0.04,
          color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
          shape: shapes[Math.floor(Math.random() * shapes.length)],
          opacity: 0.4 + Math.random() * 0.5,
        };
      });
    };

    resize();
    initParticles();

    const drawPetal = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawCircle = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity * 0.7;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawLeaf = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.quadraticCurveTo(p.size * 0.7, 0, 0, p.size);
      ctx.quadraticCurveTo(-p.size * 0.7, 0, 0, -p.size);
      ctx.fill();
      ctx.restore();
    };

    const animate = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const { width, height } = parent.getBoundingClientRect();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mouse = mouseRef.current;

      for (const p of particlesRef.current) {
        // 마우스 회피
        if (mouse) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const force = (120 - dist) / 120;
            p.x += (dx / dist) * force * 2;
            p.y += (dy / dist) * force * 2;
          }
        }

        p.drift += p.driftSpeed;
        p.x += p.speedX + Math.sin(p.drift) * 0.4;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        // 화면 밖으로 나가면 상단에서 재등장
        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }
        if (p.x > width + 20) p.x = -20;
        if (p.x < -20) p.x = width + 20;

        switch (p.shape) {
          case "petal":
            drawPetal(p);
            break;
          case "circle":
            drawCircle(p);
            break;
          case "leaf":
            drawLeaf(p);
            break;
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      resize();
      initParticles();
    };
    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const handleMouseLeave = () => {
      mouseRef.current = null;
    };
    canvas.parentElement?.addEventListener("mousemove", handleMouseMove);
    canvas.parentElement?.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
      canvas.parentElement?.removeEventListener("mousemove", handleMouseMove);
      canvas.parentElement?.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={[
        absolute ? "absolute" : "fixed",
        "inset-0 h-full w-full pointer-events-none",
      ].join(" ")}
    />
  );
}
