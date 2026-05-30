import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import MobileParticleField from "@/components/mobile/common/MobileParticleField.tsx";

/* ══════════════════════════════════════════
   MobileAmbientEffects
   ══════════════════════════════════════════
   데스크톱 HeroScene의 HeroFxLayer(나비 + ParticleField)를 모바일에 이식.
   - 파티클: 데스크톱 ParticleField의 모바일 사본(MobileParticleField) 사용.
     dpr scale 누적 버그 수정 + 마우스 회피 제거. 개수만 줄임.
   - 나비: 데스크톱과 동일한 SVG + spring + Lissajous 드리프트.
     모바일은 마우스가 없으므로 마우스 추적/회피만 제거하고 자유 부유만 유지.
   - pointer-events-none 이라 터치/스크롤을 막지 않음.
   - prefers-reduced-motion 존중(나비 드리프트 정지).

   부모는 반드시 `relative overflow-hidden` 이어야 함.
*/

interface MobileAmbientEffectsProps {
  /** 파티클 개수 (기본 16, 데스크톱은 32) */
  particleCount?: number;
  /** 나비 표시 여부 (기본 true) */
  showButterfly?: boolean;
}

export default function MobileAmbientEffects({
  particleCount = 16,
  showButterfly = true,
}: MobileAmbientEffectsProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  /* 나비 위치 — 데스크톱과 동일한 spring */
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const smoothX = useSpring(targetX, { stiffness: 35, damping: 16 });
  const smoothY = useSpring(targetY, { stiffness: 35, damping: 16 });

  /* 나비 드리프트 (Lissajous 8자) — 마우스 추적 제거, 자유 부유만 */
  useEffect(() => {
    if (!showButterfly) return;
    const root = rootRef.current;
    if (!root) return;
    const parent = root.parentElement;
    if (!parent) return;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const start = performance.now();
    let raf = 0;

    const tick = (t: number) => {
      const elapsed = (t - start) / 1000;
      const rect = parent.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      const driftX =
        w * 0.5 +
        Math.sin(elapsed * 0.35) * w * 0.3 +
        Math.sin(elapsed * 0.21) * 20;
      const driftY =
        h * 0.4 +
        Math.sin(elapsed * 0.55) * h * 0.22 +
        Math.cos(elapsed * 0.33) * 16;

      targetX.set(driftX);
      targetY.set(driftY);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [showButterfly, targetX, targetY]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
    >
      {/* ── 파티클 (데스크톱 ParticleField 의 모바일 사본, dpr 버그 수정판) ── */}
      <MobileParticleField count={particleCount} />

      {/* ── 나비 (데스크톱 HeroFxLayer 와 동일 SVG) ── */}
      {showButterfly && (
        <motion.div
          className="absolute top-0 left-0 z-10"
          style={{
            x: smoothX,
            y: smoothY,
            translateX: "-50%",
            translateY: "-50%",
          }}
        >
          <motion.div
            animate={{ rotate: [-8, 8, -8], scale: [1, 1.04, 1] }}
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
      )}
    </div>
  );
}
