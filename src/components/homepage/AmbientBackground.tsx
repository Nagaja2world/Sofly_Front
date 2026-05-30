import { motion } from "framer-motion";

/**
 * 페이지 전체를 감싸는 부드러운 그라데이션 메쉬 + 노이즈 백그라운드.
 * 따뜻한 피크닉 톤(베이지/연노랑/연하늘) 유지하면서 살짝 움직이는 aurora 블롭.
 */
export default function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* 베이스 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFF8EC] via-[#FDF6E8] to-[#F6F1E3]" />

      {/* 떠다니는 aurora 블롭들 */}
      <motion.div
        className="absolute -top-32 -left-24 h-[520px] w-[520px] rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, #FFE9A8 0%, transparent 65%)",
        }}
        animate={{ x: [0, 40, -20, 0], y: [0, 30, -10, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-20 right-[-120px] h-[600px] w-[600px] rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, #CCE3F2 0%, transparent 65%)",
        }}
        animate={{ x: [0, -50, 20, 0], y: [0, 40, -20, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[40%] left-[35%] h-[480px] w-[480px] rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, #FBD8A2 0%, transparent 65%)",
        }}
        animate={{ x: [0, 30, -30, 0], y: [0, -40, 30, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-160px] right-[10%] h-[560px] w-[560px] rounded-full opacity-45 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, #D6E8DC 0%, transparent 65%)",
        }}
        animate={{ x: [0, -30, 30, 0], y: [0, 30, -40, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 미세한 노이즈 그레인 (SVG inline) */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.05] mix-blend-multiply"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="ambient-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#ambient-noise)" />
      </svg>
    </div>
  );
}
