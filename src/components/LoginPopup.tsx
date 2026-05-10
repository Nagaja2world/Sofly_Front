import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PopUpBg from "@/assets/pop_up_bg.svg?react";
import KakaoLogin from "@/assets/kakao_login.svg?react";
import GoogleLogin from "@/assets/google_login.svg?react";

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

/**
 * 로그인 드롭다운 팝업
 * - Portal로 document.body에 렌더링 → overflow 문제 없음
 * - 트리거 버튼 위치 기준으로 오른쪽 정렬
 */
export default function LoginPopup({
  isOpen,
  onClose,
  triggerRef,
  onKakaoLogin,
  onGoogleLogin,
  onNaverLogin,
}: LoginPopupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const POPUP_WIDTH = 380;
  const [pos, setPos] = useState({ top: 0, left: 0 });

  /* 트리거 버튼 기준 위치 계산 */
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    // const updatePos = () => {
    //   const rect = triggerRef.current!.getBoundingClientRect();
    //   setPos({
    //     top: rect.bottom + 8,
    //     right: window.innerWidth - rect.right,
    //   });
    // };
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
    };
  }, [isOpen, triggerRef]);

  /* 외부 클릭 감지 */
  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen, onClose, triggerRef]);

  /* ESC 키 닫기 */
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={ref}
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
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
            <h2 className="font-pretendard text-title2 font-regular text-gray-900 mb-2">
              여행을 시작하세요
            </h2>
            <p className="font-pretendard text-body3 text-gray-600">
              로그인하고 나만의 여행을 기록해 보세요
            </p>
          </div>

          {/* 로그인 버튼 영역 */}
          <div className="flex flex-col gap-3 mt-auto">
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
              className="w-full flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition-opacity rounded-xl py-3"
              style={{ background: '#03C75A', border: 'none' }}
            >
              <span style={{
                background: 'white', color: '#03C75A',
                fontWeight: 900, fontSize: 16,
                width: 24, height: 24, borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>N</span>
              <span className="font-pretendard font-semibold text-white" style={{ fontSize: 15 }}>
                네이버로 시작하기
              </span>
            </button>
          </div>

          {/* 이용약관 안내 */}
          <p className="font-pretendard text-body5 text-gray-500 text-center mt-5 leading-relaxed">
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
        </div>
      </div>
    </div>,
    document.body,
  );
}
