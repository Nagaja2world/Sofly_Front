interface FooterLink {
  label: string;
  href: string;
}

interface FooterProps {
  /** 우측 링크 목록 (기본: 이용약관, 개인정보처리방침, 여행약관) */
  links?: FooterLink[];
}

const defaultLinks: FooterLink[] = [
  { label: "이용약관", href: "#" },
  { label: "개인정보처리방침", href: "#" },
  { label: "여행약관", href: "#" },
];

export default function Footer({ links = defaultLinks }: FooterProps) {
  return (
    <footer className="py-8 bg-white">
      <div className="mx-auto flex justify-between items-start flex-wrap gap-6">
        {/* 회사 정보 */}
        <div className="flex-1 min-w-[300px]">
          <span className="font-montserrat text-body2 font-semibold text-gray-700">
            Sofly
          </span>
          <p className="font-pretendard text-body3 text-gray-600 mt-3 leading-relaxed">
            대표 : 김은솔 <span className="text-gray-400">ㅣ</span> (12345)
            용인시 처인구 명지로 116, 5공학관{" "}
            <span className="text-gray-400"></span>
            <br />
            이메일 : nagaja2world@gmail.com{" "}
            <span className="text-gray-400"></span>{" "}
            <span className="text-gray-400">ㅣ</span>
            개인정보보호책임자 : 나가자세계로
          </p>
          <p className="font-pretendard text-body3 text-gray-600 mt-3">
            COPYRIGHT © Sofly. ALL RIGHTS RESERVED.
          </p>
        </div>

        {/* 링크 */}
        <div className="flex gap-6">
          {links.map((link, index) => (
            <span key={link.label} className="flex items-center gap-6">
              <a
                href={link.href}
                className="font-pretendard text-body4 text-gray-800 no-underline hover:text-gray-900 transition-colors"
              >
                {link.label}
              </a>
              {index < links.length - 1 && (
                <span className="text-gray-400">|</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
