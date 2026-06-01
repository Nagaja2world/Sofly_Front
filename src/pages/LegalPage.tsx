import { useParams, Link } from "react-router-dom";

const LEGAL_CONTENT: Record<string, { title: string; body: string }> = {
  terms: { title: "이용약관", body: "이용약관 내용이 들어갈 자리입니다." },
  privacy: {
    title: "개인정보처리방침",
    body: "개인정보처리방침 내용이 들어갈 자리입니다.",
  },
  travel: { title: "여행약관", body: "여행약관 내용이 들어갈 자리입니다." },
};

export default function LegalPage() {
  const { type } = useParams<{ type: string }>();
  const content = type ? LEGAL_CONTENT[type] : undefined;

  if (!content) {
    return (
      <div className="mx-auto max-w-[800px] px-5 py-20">
        <h1 className="font-montserrat text-h2 font-semibold text-gray-800">
          페이지를 찾을 수 없습니다.
        </h1>
        <Link
          to="/"
          className="font-pretendard text-body3 text-gray-600 underline mt-4 inline-block"
        >
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[800px] px-5 py-16 min-h-[60vh]">
      <h1 className="font-montserrat text-h2 font-semibold text-gray-800">
        {content.title}
      </h1>
      <p className="font-pretendard text-body3 text-gray-600 mt-6 leading-relaxed whitespace-pre-line">
        {content.body}
      </p>
    </div>
  );
}
