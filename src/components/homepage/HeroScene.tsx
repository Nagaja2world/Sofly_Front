import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import heroSvg from "@/assets/home_hero.svg";
import ParticleField from "./ParticleField";

/**
 * 메인 히어로 영역 — 기존 watercolor SVG(텍스트/일러스트 포함)를 원본 비율 그대로 두고,
 * 그 위에 다음 효과만 오버레이로 추가:
 * - 스크롤 패럴랙스 (위로 사라지는 부드러운 모션)
 * - 비행기 경로를 따라 트레일 그리는 점선
 * - 마우스를 따라다니는 나비
 * - 떠다니는 꽃잎 파티클
 */
export default function HeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // 스크롤 패럴랙스만 유지 (이미지 자체는 마우스 패럴랙스 안 줘서 잘림 방지)
  const { scrollY } = useScroll();
  const scrollHeroY = useTransform(scrollY, [0, 400], [0, -60]);
  const scrollOpacity = useTransform(scrollY, [0, 300], [1, 0.4]);

  // 마우스 따라다니는 나비
  const butterflyX = useMotionValue(0);
  const butterflyY = useMotionValue(0);
  const smoothButterflyX = useSpring(butterflyX, {
    stiffness: 50,
    damping: 18,
  });
  const smoothButterflyY = useSpring(butterflyY, {
    stiffness: 50,
    damping: 18,
  });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setSize({ w: width, h: height });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    butterflyX.set(e.clientX - rect.left);
    butterflyY.set(e.clientY - rect.top);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative h-[374px] w-full overflow-hidden"
    >
      {/* 베이스 히어로 SVG — 원본 비율 그대로, 스크롤 시 살짝 페이드만 */}
      <motion.img
        src={heroSvg}
        alt="Travel Like a Picnic"
        className="absolute inset-0 h-full w-full object-cover block"
        style={{
          y: scrollHeroY,
          opacity: scrollOpacity,
        }}
      />

      {/* 비행기 경로 트레일 (SVG 점선 애니메이션) */}
      <svg
        className="absolute inset-0 h-full w-full pointer-events-none"
        viewBox={`0 0 ${size.w || 1200} ${size.h || 460}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="trail-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F0A75E" stopOpacity="0" />
            <stop offset="50%" stopColor="#F0A75E" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#F0A75E" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={`M ${(size.w || 1200) * 0.12} ${(size.h || 460) * 0.45}
              Q ${(size.w || 1200) * 0.35} ${(size.h || 460) * 0.72}
                ${(size.w || 1200) * 0.55} ${(size.h || 460) * 0.55}
              T ${(size.w || 1200) * 0.92} ${(size.h || 460) * 0.6}`}
          stroke="url(#trail-gradient)"
          strokeWidth="2"
          strokeDasharray="6 10"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 1, 0] }}
          transition={{
            duration: 6,
            repeat: Infinity,
            times: [0, 0.5, 0.75, 1],
            ease: "easeInOut",
          }}
        />
      </svg>

      {/* 떠다니는 꽃잎/잎 파티클 */}
      <ParticleField count={32} />

      {/* 마우스 따라다니는 나비 */}
      <motion.div
        className="absolute pointer-events-none z-20"
        style={{
          x: smoothButterflyX,
          y: smoothButterflyY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      >
        <motion.div
          animate={{ rotate: [-8, 8, -8], scale: [1, 1.05, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="32" height="28" viewBox="0 0 32 28" fill="none">
            <motion.ellipse
              cx="11"
              cy="11"
              rx="9"
              ry="7"
              fill="#F8B4C9"
              opacity="0.85"
              animate={{ scaleX: [1, 0.4, 1] }}
              transition={{
                duration: 0.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ transformOrigin: "16px 11px" }}
            />
            <motion.ellipse
              cx="21"
              cy="11"
              rx="9"
              ry="7"
              fill="#F8B4C9"
              opacity="0.85"
              animate={{ scaleX: [1, 0.4, 1] }}
              transition={{
                duration: 0.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ transformOrigin: "16px 11px" }}
            />
            <motion.ellipse
              cx="11"
              cy="18"
              rx="6"
              ry="5"
              fill="#F8B4C9"
              opacity="0.7"
              animate={{ scaleX: [1, 0.4, 1] }}
              transition={{
                duration: 0.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ transformOrigin: "16px 18px" }}
            />
            <motion.ellipse
              cx="21"
              cy="18"
              rx="6"
              ry="5"
              fill="#F8B4C9"
              opacity="0.7"
              animate={{ scaleX: [1, 0.4, 1] }}
              transition={{
                duration: 0.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ transformOrigin: "16px 18px" }}
            />
            <rect x="15" y="8" width="2" height="14" rx="1" fill="#5B4A3A" />
            <circle cx="16" cy="8" r="2" fill="#5B4A3A" />
          </svg>
        </motion.div>
      </motion.div>

    </div>
  );
}
