import Button from "@/components/common/Button";
import NarrowRightIcon from "@/assets/narrow-right.svg?react";

interface FeatureCardProps {
  /** 카드 제목 (영문) */
  title: string;
  /** 카드 부제목 (한글) */
  subtitle: string;
  /** 배경색 또는 그라디언트 CSS 값 */
  bg: string;
  /** 우하단 일러스트 */
  illustration: React.ReactNode;
  /** 클릭 시 콜백 */
  onClick?: () => void;
}

export default function FeatureCard({
  title,
  subtitle,
  bg,
  illustration,
  onClick,
}: FeatureCardProps) {
  const isGradient = bg.startsWith("linear");

  return (
    <div
      onClick={onClick}
      className={[
        "flex-1 rounded-xl border border-gray-300",
        "p-7 flex flex-col justify-between",
        "relative overflow-hidden min-h-[200px]",
        "cursor-pointer transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-lg",
      ].join(" ")}
      style={isGradient ? { background: bg } : { backgroundColor: bg }}
    >
      {/* 텍스트 */}
      <div className="relative min-w-0">
        <h3 className="font-montserrat text-[20px] font-bold text-gray-900 mb-2 truncate">
          {title}
        </h3>
        <p className="font-pretendard text-body3 truncate text-gray-600">
          {subtitle}
        </p>
      </div>

      {/* 일러스트 */}
      <div className="absolute bottom-0 right-0">{illustration}</div>

      {/* CTA */}
      <div className="relative mt-15">
        <Button btnType="text" icon={<NarrowRightIcon />}>
          Get Started
        </Button>
      </div>
    </div>
  );
}
