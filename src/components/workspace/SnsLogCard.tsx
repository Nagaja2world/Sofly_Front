import { useEffect, useRef, useState, type ChangeEvent } from "react";
import PlusIcon from "@/assets/plus.svg?react";
import Edit2Icon from "@/assets/edit2.svg?react";

/* ══════════════════════════════════════════
   타입
   ══════════════════════════════════════════ */

/** 미디어 한 개 (사진 or 영상) */
export interface SnsMedia {
  /** 고유 id (편집/삭제 시 사용) */
  id: string;
  /** 미디어 타입 */
  type: "image" | "video";
  /** 표시 URL (현재는 ObjectURL, API 연결 시 서버 URL로 교체) */
  url: string;
}

/**
 * 편집 모드에서 부모로 전달되는 데이터 묶음
 * - 보기 모드 props와 동일 형태
 */
export interface SnsLogData {
  /** 캡션 (인스타 게시물 텍스트) */
  caption?: string;
  /** 미디어 목록 (사진/영상) */
  media: SnsMedia[];
}

interface SnsLogCardProps {
  /** 캡션 */
  caption?: string;
  /** 미디어 목록 */
  media?: SnsMedia[];
  /** 카드 자체를 삭제할 때 호출 (헤더 우상단 삭제 버튼) */
  onDelete?: () => void;
  /**
   * 편집 저장 콜백.
   * 편집 모드에서 "저장"을 누르면 호출됨.
   */
  onSave?: (data: SnsLogData) => void;
  /**
   * "업로드" 버튼 클릭 시 호출 (TODO: SNS 페이지에 게시).
   * 현재는 부모에서 console.log + TODO 주석 처리.
   */
  onUpload?: (data: SnsLogData) => void;
  /** 추가 클래스 */
  className?: string;
}

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

/**
 * SNS 카드 (인스타그램 게시물 스타일)
 *
 * - 워크스페이스당 1개. 항상 여행 기록 배열의 맨 왼쪽(첫 번째)에 위치.
 * - 사진/영상만 업로드 가능 (TravelLogCard처럼 본문 에디터는 없음).
 * - "업로드" 버튼 클릭 시 SNS 페이지에 게시 (현재는 TODO).
 *
 * 두 가지 모드:
 *
 * 1) 보기 모드 (기본)
 *    - 헤더: "SNS 게시물" 라벨 + 편집/삭제 버튼
 *    - 미디어 캐러셀: 좌우 페이지네이션 (인디케이터 점)
 *    - 캡션 (있을 때만)
 *    - 하단 "업로드" 버튼
 *
 * 2) 편집 모드
 *    - 헤더: "SNS 게시물" 라벨 + 취소/저장 버튼
 *    - 미디어 그리드: 추가 / 삭제 가능
 *    - 캡션 textarea
 *
 * 디자인 스펙
 * - TravelLogCard와 동일하게 396px 폭, rounded-xl, gray-300 border
 * - 미디어 영역: 정사각형 (1:1 비율, 인스타 스타일)
 */
export default function SnsLogCard({
  caption,
  media,
  onDelete,
  onSave,
  onUpload,
  className = "",
}: SnsLogCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  /** 편집 중 임시 데이터 */
  const [draft, setDraft] = useState<SnsLogData>({
    caption,
    media: media ?? [],
  });

  /** 미디어 캐러셀의 현재 인덱스 (보기 모드)
   *  주의: 이 state 값이 media 길이를 초과할 수 있으므로(저장 후 미디어 삭제 등),
   *  렌더 시점에는 항상 아래의 safeCarouselIndex를 사용해야 함. */
  const [carouselIndex, setCarouselIndex] = useState(0);

  /** 편집 중 새로 만든 ObjectURL 추적 (메모리 누수 방지) */
  const objectUrlsRef = useRef<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* 컴포넌트 언마운트 시 ObjectURL 정리 */
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    };
  }, []);

  /** 캐러셀 인덱스를 media 길이에 맞춰 보정한 값.
   *  렌더 중에 파생값으로 계산 → useEffect + setState로 인한 cascading render 방지.
   *  (참고: https://react.dev/learn/you-might-not-need-an-effect) */
  const mediaLength = media?.length ?? 0;
  const safeCarouselIndex =
    mediaLength === 0 ? 0 : Math.min(carouselIndex, mediaLength - 1);

  /* ── 모드 전환 ── */
  const enterEditMode = () => {
    setDraft({ caption, media: media ?? [] });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    /* 새로 만든 ObjectURL 정리 */
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current = [];
    setIsEditing(false);
  };

  const saveEdit = () => {
    const cleaned: SnsLogData = {
      caption: draft.caption?.trim() || undefined,
      media: draft.media,
    };
    onSave?.(cleaned);
    objectUrlsRef.current = [];
    setIsEditing(false);
  };

  /* ── 미디어 추가/삭제 (편집 모드) ── */
  const handlePickMedia = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newMedia: SnsMedia[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      objectUrlsRef.current.push(url);

      const isVideo = file.type.startsWith("video/");
      newMedia.push({
        id: `m-${Date.now()}-${i}`,
        type: isVideo ? "video" : "image",
        url,
      });
    }

    setDraft((prev) => ({ ...prev, media: [...prev.media, ...newMedia] }));
    /* 같은 파일 다시 선택 가능하도록 input 리셋 */
    e.target.value = "";
  };

  const handleRemoveMedia = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      media: prev.media.filter((m) => m.id !== id),
    }));
  };

  /* ── 업로드 (보기 모드 하단 버튼) ── */
  const handleUploadClick = () => {
    onUpload?.({ caption, media: media ?? [] });
  };

  /* ══════════════════════════════════════════
     렌더링
     ══════════════════════════════════════════ */

  const currentMedia =
    media && media.length > 0 ? media[safeCarouselIndex] : null;
  const hasMedia = (media?.length ?? 0) > 0;

  return (
    <article
      className={[
        "bg-white rounded-xl border border-gray-300 overflow-hidden",
        "flex flex-col w-[396px] shrink-0",
        className,
      ].join(" ")}
    >
      {/* ══ 헤더 ══ */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {/* SNS 표시용 작은 아이콘 (카메라 느낌) */}
          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-gray-900 text-body5 font-semibold"
            aria-hidden="true"
          >
            S
          </span>
          <h3 className="font-pretendard text-body1 font-semibold text-gray-900 m-0">
            SNS 게시물
          </h3>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={cancelEdit}
              className="px-3 py-1 rounded text-body3 text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer border-none bg-transparent"
            >
              취소
            </button>
            <button
              type="button"
              onClick={saveEdit}
              className="px-3 py-1 rounded text-body3 font-semibold text-gray-900 bg-primary hover:brightness-95 transition-all cursor-pointer border-none"
            >
              저장
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={enterEditMode}
              aria-label="SNS 카드 편집"
              className="p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer border-none bg-transparent inline-flex items-center justify-center"
            >
              <Edit2Icon className="w-4 h-4" />
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                aria-label="SNS 카드 삭제"
                className="p-1.5 rounded text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer border-none bg-transparent inline-flex items-center justify-center text-body3"
              >
                ×
              </button>
            )}
          </div>
        )}
      </header>

      {/* ══ 본문: 보기 vs 편집 ══ */}
      {isEditing ? (
        /* ───────── 편집 모드 ───────── */
        <div className="flex flex-col gap-4 p-4">
          {/* 미디어 그리드 */}
          <div>
            <label className="block font-pretendard text-body3 font-medium text-gray-700 mb-2">
              사진 / 영상
            </label>
            <div className="grid grid-cols-3 gap-2">
              {draft.media.map((m) => (
                <div
                  key={m.id}
                  className="relative aspect-square rounded-md overflow-hidden bg-gray-100"
                >
                  {m.type === "image" ? (
                    <img
                      src={m.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={m.url}
                      className="w-full h-full object-cover"
                      muted
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(m.id)}
                    aria-label="미디어 삭제"
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-body5 flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer border-none"
                  >
                    ×
                  </button>
                  {/* 영상 표시 라벨 */}
                  {m.type === "video" && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-body6 font-medium">
                      영상
                    </span>
                  )}
                </div>
              ))}

              {/* 추가 버튼 */}
              <button
                type="button"
                onClick={handlePickMedia}
                className="aspect-square rounded-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 hover:border-gray-500 hover:bg-gray-50 transition-colors cursor-pointer bg-white"
              >
                <PlusIcon className="w-5 h-5 text-gray-500" />
                <span className="font-pretendard text-body5 text-gray-500">
                  추가
                </span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* 캡션 */}
          <div>
            <label
              htmlFor="sns-caption"
              className="block font-pretendard text-body3 font-medium text-gray-700 mb-2"
            >
              내용
            </label>
            <textarea
              id="sns-caption"
              value={draft.caption ?? ""}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, caption: e.target.value }))
              }
              placeholder="SNS에 올릴 글을 작성하세요..."
              rows={4}
              className="w-full px-3 py-2 rounded-md border border-gray-300 font-pretendard text-body2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-700 transition-colors resize-none"
            />
          </div>
        </div>
      ) : (
        /* ───────── 보기 모드 ───────── */
        <>
          {/* 미디어 캐러셀 (정사각형, 인스타 스타일) */}
          <div className="relative w-full aspect-square bg-gray-100">
            {currentMedia ? (
              currentMedia.type === "image" ? (
                <img
                  src={currentMedia.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={currentMedia.url}
                  controls
                  className="w-full h-full object-cover bg-black"
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 font-pretendard text-body3">
                사진/영상을 추가하세요
              </div>
            )}

            {/* 좌우 페이지네이션 (미디어 2개 이상일 때만) */}
            {(media?.length ?? 0) > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setCarouselIndex(Math.max(0, safeCarouselIndex - 1))
                  }
                  disabled={safeCarouselIndex === 0}
                  aria-label="이전 미디어"
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer border-none"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCarouselIndex(
                      Math.min(mediaLength - 1, safeCarouselIndex + 1),
                    )
                  }
                  disabled={safeCarouselIndex >= mediaLength - 1}
                  aria-label="다음 미디어"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer border-none"
                >
                  ›
                </button>

                {/* 인디케이터 점 */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
                  {media?.map((_, i) => (
                    <span
                      key={i}
                      className={[
                        "w-1.5 h-1.5 rounded-full transition-all",
                        i === safeCarouselIndex
                          ? "bg-white w-3"
                          : "bg-white/60",
                      ].join(" ")}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 캡션 + 업로드 버튼 영역 */}
          <div className="flex flex-col gap-3 p-4">
            {caption && (
              <p className="font-pretendard text-body2 text-gray-900 m-0 whitespace-pre-wrap break-words">
                {caption}
              </p>
            )}

            {/* 업로드 버튼: SNS 페이지에 게시 (TODO) */}
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={!hasMedia}
              className={[
                "w-full py-2.5 rounded-md font-pretendard text-body2 font-semibold transition-all border-none",
                hasMedia
                  ? "bg-gray-900 text-white hover:bg-gray-800 cursor-pointer"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed",
              ].join(" ")}
            >
              업로드
            </button>
          </div>
        </>
      )}
    </article>
  );
}
