import { useEffect, useRef } from "react";

/* ══════════════════════════════════════════
   MobileParticleField
   ══════════════════════════════════════════
   데스크톱 ParticleField(Canvas 꽃잎/원/잎 파티클)의 모바일 전용 사본.
   데스크톱 원본 대비 변경점:
   1) dpr scale 누적 버그 수정 — resize 때마다 setTransform 으로 초기화 후 scale.
      (모바일은 주소창 숨김/표시로 resize 가 잦아 누적 시 파티클이 커지거나 어긋남)
   2) 마우스 회피/추적 로직 제거 — 터치 환경엔 mousemove 가 없음.
   나머지(파티클 속성/모양/드리프트/재등장)는 데스크톱과 동일.
*/

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

export default function MobileParticleField({
  count = 16,
  absolute = true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /* 모션 줄임 설정이면 렌더하지 않음 */
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      /* ── 버그 수정: scale 누적 방지 ──
         resize 가 반복 호출돼도 매번 변환을 1:1 로 초기화한 뒤 dpr 만큼만 scale */
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    const initParticles = () => {
      const { width, height } = canvas.getBoundingClientRect();
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
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particlesRef.current) {
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

    /* Hero 컨테이너 높이가 이미지 로드 등으로 뒤늦게 확정되는 경우 대응.
       마운트 시점엔 높이가 0이라 파티클이 안 보일 수 있으므로,
       canvas(=부모를 꽉 채움) 크기 변화를 감지해 다시 측정·재배치한다.
       높이가 0→실제값으로 처음 확정될 때만 재초기화해 깜빡임을 막는다. */
    let lastH = canvas.getBoundingClientRect().height;
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        const h = canvas.getBoundingClientRect().height;
        resize();
        /* 높이가 새로 생겼거나 크게 바뀌면 파티클 재분포 */
        if ((lastH < 1 && h >= 1) || Math.abs(h - lastH) > 1) {
          initParticles();
        }
        lastH = h;
      });
      ro.observe(canvas);
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
      ro?.disconnect();
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
