import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useIsCompact } from "@/hooks/useMediaQuery";
import BottomSheet from "@/components/mobile/searchbar/BottomSheet";
import PopUpBg from "@/assets/pop_up_bg.svg?react";
import KakaoLogin from "@/assets/kakao_login.svg?react";
import GoogleLogin from "@/assets/google_login.svg?react";
import NaverLogin from "@/assets/naver_login.svg?react";

interface LoginPopupProps {
  /** 팝업 열림 여부 */
  isOpen: boolean;
  /** 닫기 콜백 */
  onClose: () => void;
  /** 트리거 버튼의 ref (위치 계산용) */
  triggerRef: React.RefObject<HTMLElement | null>;
  /** 카카오 로그인 클릭 */
  onKakaoLogin?: () => void;
  /** 구글 로그인 클릭 */
  onGoogleLogin?: () => void;
  /** 네이버 로그인 클릭 */
  onNaverLogin?: () => void;
}

/* ══════════════════════════════════════════
   로그인 팝업
   ══════════════════════════════════════════
   - 데스크톱(>= 768px): 트리거 버튼 기준 드롭다운 (PopUpBg SVG 배경)
   - 모바일(< 768px): 화면 하단 BottomSheet (높이 70vh 고정)
   로그인 버튼/핸들러/약관 문구는 양쪽이 공유하고 표현(컨테이너)만 분기.
*/

/* ── 타이틀 + 안내문 (데스크톱·모바일 공유) ── */
function LoginHeading() {
  return (
    <div>
      <h2 className="font-pretendard text-title2 font-regular text-gray-900 mb-2.5">
        여행을 시작하세요
      </h2>
      <p className="font-pretendard text-body3 text-gray-600 m-0">
        로그인하고 나만의 여행을 기록해 보세요
      </p>
    </div>
  );
}

/* ── 로그인 버튼 3종 (데스크톱·모바일 공유) ── */
function LoginButtons({
  onKakaoLogin,
  onGoogleLogin,
  onNaverLogin,
}: Pick<LoginPopupProps, "onKakaoLogin" | "onGoogleLogin" | "onNaverLogin">) {
  return (
    <div className="flex flex-col gap-5 pb-4">
      <button
        type="button"
        onClick={onKakaoLogin}
        className="w-full bg-transparent border-none p-0 cursor-pointer hover:opacity-90 transition-opacity"
      >
        <KakaoLogin className="w-full h-auto" />
      </button>

      <button
        type="button"
        onClick={onGoogleLogin}
        className="w-full bg-transparent border-none p-0 cursor-pointer hover:opacity-90 transition-opacity"
      >
        <GoogleLogin className="w-full h-auto" />
      </button>

      <button
        type="button"
        onClick={onNaverLogin}
        className="w-full bg-transparent border-none p-0 cursor-pointer hover:opacity-90 transition-opacity"
      >
        <NaverLogin className="w-full h-auto" />
      </button>
    </div>
  );
}

/* ── 약관 안내 (데스크톱·모바일 공유) ── */
function TermsNotice() {
  return (
    <p className="font-pretendard text-body5 text-gray-500 text-center m-0 leading-relaxed">
      로그인 시{" "}
      <button
        type="button"
        className="inline text-[#BA7517] underline hover:text-gray-900 bg-transparent border-none p-0 cursor-pointer font-inherit text-inherit"
      >
        이용약관
      </button>
      및{" "}
      <button
        type="button"
        className="inline text-[#BA7517] underline hover:text-gray-900 bg-transparent border-none p-0 cursor-pointer font-inherit text-inherit"
      >
        개인정보 처리방침
      </button>
      에 동의합니다.
    </p>
  );
}

export default function LoginPopup({
  isOpen,
  onClose,
  triggerRef,
  onKakaoLogin,
  onGoogleLogin,
  onNaverLogin,
}: LoginPopupProps) {
  const isCompact = useIsCompact();
  const ref = useRef<HTMLDivElement>(null);
  const POPUP_WIDTH = 380;
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  /* 트리거 버튼 기준 위치 계산 (데스크톱 드롭다운 전용) */
  useEffect(() => {
    if (!isOpen || isCompact || !triggerRef.current) return;

    const updatePos = () => {
      const rect = triggerRef.current!.getBoundingClientRect();
      // 팝업 오른쪽 끝 = 버튼 오른쪽 끝에 정렬
      let left = rect.right - POPUP_WIDTH;
      // 왼쪽 화면 밖으로 나가지 않도록 보정
      if (left < 8) left = 8;
      setPos({
        top: rect.bottom + 8,
        left,
      });
    };

    updatePos();
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", updatePos, true);

    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos, true);
      setPos(null);
    };
  }, [isOpen, isCompact, triggerRef]);

  /* 외부 클릭 감지 (데스크톱 드롭다운 전용 — 시트는 백드롭이 처리) */
  useEffect(() => {
    if (!isOpen || isCompact) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      onClose();
    };
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, isCompact, onClose, triggerRef]);

  /* ESC 키 닫기 (데스크톱 드롭다운 전용 — 시트는 자체 ESC 처리) */
  useEffect(() => {
    if (!isOpen || isCompact) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, isCompact, onClose]);

  /* ══════════════════════════════════════════
     모바일: 하단 BottomSheet (70vh 고정)
     ══════════════════════════════════════════
     - 시트 본문을 세로 flex로 두고 타이틀/버튼/약관 사이에
       신축 스페이서(flex-1)를 넣어 세 영역을 균등 분산.
     - BottomSheet는 maxHeight(70vh)만 적용하므로, 내부 컨테이너에
       minHeight: calc(70vh - 20px)를 줘서 본체가 핸들(약 20px)+본문
       = 정확히 70vh를 채우게 한다. maxHeight와 일치 → 넘침/스크롤 없음.
  */
  if (isCompact) {
    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} maxHeightVh={60}>
        <div
          className="flex flex-col px-6 pt-3 pb-3"
          style={{ minHeight: "calc(60vh - 20px)" }}
        >
          <LoginHeading />

          {/* 구분선 (모바일 시트 전용) */}
          <div
            className="mt-[18px] border-t pb-5"
            style={{ borderColor: "#E8E5DA" }}
          />

          <LoginButtons
            onKakaoLogin={onKakaoLogin}
            onGoogleLogin={onGoogleLogin}
            onNaverLogin={onNaverLogin}
          />

          <TermsNotice />
        </div>
      </BottomSheet>
    );
  }

  /* ══════════════════════════════════════════
     데스크톱: 트리거 기준 드롭다운
     ══════════════════════════════════════════ */
  if (!isOpen) return null;

  return createPortal(
    <div
      ref={ref}
      style={{
        position: "fixed",
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        visibility: pos ? "visible" : "hidden",
      }}
      className="z-50 animate-[popupFadeIn_0.2s_ease-out]"
      role="dialog"
      aria-modal="false"
    >
      <div className="relative w-[380px]">
        <PopUpBg className="w-full h-auto" />

        {/* 컨텐츠 오버레이 */}
        <div className="absolute inset-0 flex flex-col px-8 pt-14 pb-8">
          {/* 타이틀 영역 */}
          <div className="mb-6">
            <LoginHeading />
          </div>

          {/* 로그인 버튼 영역 */}
          <div className="mt-auto">
            <LoginButtons
              onKakaoLogin={onKakaoLogin}
              onGoogleLogin={onGoogleLogin}
              onNaverLogin={onNaverLogin}
            />
          </div>

          {/* 이용약관 안내 */}
          <div className="mt-5">
            <TermsNotice />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
