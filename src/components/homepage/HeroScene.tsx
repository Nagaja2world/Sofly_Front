import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import heroSvg from "@/assets/home_hero.svg";
import HeroFxLayer from "./HeroFxLayer";

/**
 * 홈페이지 메인 히어로 — 기존 watercolor SVG(텍스트/일러스트 포함)를 원본 비율 그대로 두고,
 * 그 위에 다음 효과만 오버레이로 추가:
 * - 스크롤 패럴랙스 (위로 사라지는 부드러운 모션)
 * - 비행기 경로를 따라 트레일 그리는 점선
 * - 자유롭게 떠다니며 마우스를 따라오는 나비 (HeroFxLayer)
 * - 떠다니는 꽃잎 파티클 (HeroFxLayer)
 */
export default function HeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const { scrollY } = useScroll();
  const scrollHeroY = useTransform(scrollY, [0, 400], [0, -60]);
  const scrollOpacity = useTransform(scrollY, [0, 300], [1, 0.4]);

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

  return (
    <div
      ref={containerRef}
      className="relative h-[374px] w-full overflow-hidden"
    >
      {/* 베이스 히어로 SVG — 원본 비율 그대로, 스크롤 시 살짝 페이드/이동만 */}
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
        viewBox={`0 0 ${size.w || 1200} ${size.h || 374}`}
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
          d={`M ${(size.w || 1200) * 0.12} ${(size.h || 374) * 0.45}
              Q ${(size.w || 1200) * 0.35} ${(size.h || 374) * 0.72}
                ${(size.w || 1200) * 0.55} ${(size.h || 374) * 0.55}
              T ${(size.w || 1200) * 0.92} ${(size.h || 374) * 0.6}`}
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

      {/* 나비 + 떠다니는 파티클 (공통 효과 레이어) */}
      <HeroFxLayer particleCount={32} />
    </div>
  );
}
