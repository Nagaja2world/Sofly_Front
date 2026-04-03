interface MobileFooterLink {
  label: string;
  href: string;
}

interface MobileFooterProps {
  /** 하단 링크 목록 */
  links?: MobileFooterLink[];
  /** 추가 클래스 */
  className?: string;
}

const defaultLinks: MobileFooterLink[] = [
  { label: "이용약관", href: "#" },
  { label: "개인정보처리방침", href: "#" },
  { label: "여행약관", href: "#" },
];

export default function MobileFooter({
  links = defaultLinks,
  className = "",
}: MobileFooterProps) {
  return (
    <footer
      className={[
        "px-5 py-8 bg-white border-t border-gray-300",
        className,
      ].join(" ")}
    >
      {/* 로고 */}
      <span className="font-montserrat text-body2 font-semibold text-gray-700 gap-6">
        Sofly
      </span>

      {/* 회사 정보 */}
      <div className="mt-4 flex flex-col gap-4 font-pretendard text-body4 text-gray-600 leading-relaxed">
        <p>
          대표 : 홍길동 <span className="text-gray-400">ㅣ</span> (12345)
          서울특별시 OO구 OO로 00, 123
        </p>
        <p>고객센터 : 1234-1234 (평일 10시~18시)</p>
        <p>이메일 : hong1234@sofly.co.kr</p>
        <p>사업자등록번호 : 123-45-67890</p>
        <p>개인정보보호책임자 : 홍길동</p>
      </div>

      {/* 저작권 */}
      <p className="font-pretendard text-body4 text-gray-600 mt-4">
        COPYRIGHT © Sofly. ALL RIGHTS RESERVED.
      </p>

      {/* 구분선 + 링크 */}
      <div className="mt-4 pt-4">
        <div className="flex items-center gap-4">
          {links.map((link, index) => (
            <span key={link.label} className="flex items-center gap-4">
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
