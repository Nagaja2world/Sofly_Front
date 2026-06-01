import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import ParticleField from "./ParticleField";

interface Props {
  /** 떠다닐 파티클 수 */
  particleCount?: number;
  /** 나비 표시 여부 */
  showButterfly?: boolean;
}

/**
 * Hero 영역 위에 얹어 쓰는 효과 레이어:
 * - 떠다니는 꽃잎/잎 파티클
 * - 자연스러운 경로로 나풀거리는 나비. 마우스가 hero 위에 들어오면 그쪽으로 부드럽게 따라옴.
 *   마우스가 멈추거나 떠나면 다시 자유로운 드리프트로 돌아감.
 *
 * 사용 시 부모 컨테이너에 `position: relative`가 있어야 한다.
 */
export default function HeroFxLayer({
  particleCount = 32,
  showButterfly = true,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  // 나비의 실제 위치 (spring으로 부드럽게 따라옴)
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const smoothX = useSpring(targetX, { stiffness: 35, damping: 16 });
  const smoothY = useSpring(targetY, { stiffness: 35, damping: 16 });

  // 마우스 추적 상태
  const mouseActiveRef = useRef(false);
  const lastMouseTimeRef = useRef(0);

  useEffect(() => {
    if (!showButterfly) return;
    const root = rootRef.current;
    if (!root) return;
    const parent = root.parentElement;
    if (!parent) return;

    const start = performance.now();
    let raf = 0;

    const tick = (t: number) => {
      const elapsed = (t - start) / 1000;
      const rect = parent.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // Lissajous 곡선으로 부드러운 8자 드리프트
      const driftX =
        w * 0.5 + Math.sin(elapsed * 0.35) * w * 0.32 + Math.sin(elapsed * 0.21) * 30;
      const driftY =
        h * 0.45 + Math.sin(elapsed * 0.55) * h * 0.22 + Math.cos(elapsed * 0.33) * 20;

      // 마우스가 1.5초 이상 움직이지 않으면 드리프트로 복귀
      if (mouseActiveRef.current && t - lastMouseTimeRef.current > 1500) {
        mouseActiveRef.current = false;
      }

      if (!mouseActiveRef.current) {
        targetX.set(driftX);
        targetY.set(driftY);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const handleMove = (e: MouseEvent) => {
      const rect = root.getBoundingClientRect();
      const inBounds =
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top  && e.clientY <= rect.bottom;
      if (inBounds) {
        targetX.set(e.clientX - rect.left);
        targetY.set(e.clientY - rect.top);
        mouseActiveRef.current = true;
        lastMouseTimeRef.current = performance.now();
      } else {
        mouseActiveRef.current = false;
      }
    };

    document.addEventListener("mousemove", handleMove);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", handleMove);
    };
  }, [showButterfly, targetX, targetY]);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="absolute inset-0 pointer-events-none"
    >
      {/* 떠다니는 잎/꽃잎 파티클 */}
      <ParticleField count={particleCount} />

      {/* 나비 */}
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
