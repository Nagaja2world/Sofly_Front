import { useEffect, useRef, useState, type ChangeEvent } from "react";
import PlusIcon from "@/assets/plus.svg?react";
import Edit2Icon from "@/assets/edit2.svg?react";
import ConfirmPopup from "@/components/common/ConfirmPopup";
import type {
  CompactSnsLogData,
  CompactSnsMedia,
} from "./CompactTravelLogSection";

/* ══════════════════════════════════════════
   CompactSnsLogCard
   ══════════════════════════════════════════
   좁은 화면(< 768px)용 SNS 게시물 카드 — 여행 기록 가로 스크롤의 맨 앞 카드.

   구조 (인스타그램 게시물 스타일):
   ┌────────────────────────────┐
   │ Ⓢ SNS 게시물        [편집][×]│  ← 헤더
   ├────────────────────────────┤
   │        미디어 (1:1)          │  ← 보기: 캐러셀 / 편집: 그리드
   │                       ‹ ›  │
   │            • • •           │
   ├────────────────────────────┤
   │ 캡션 텍스트…                 │  ← 보기: 캡션 / 편집: textarea
   └────────────────────────────┘

   두 가지 모드 (데스크톱 SnsLogCard와 동일):

   1) 보기 모드 (기본)
      - 미디어 캐러셀 (좌우 페이지네이션 + 인디케이터).
      - 캡션 (있을 때만).

   2) 편집 모드 (onSave가 있을 때만 진입 가능)
      - 미디어 그리드: 사진/영상 추가·삭제.
      - 캡션 textarea.
      - "저장" 시 onSave(CompactSnsLogData) / "취소" 시 진입 시점으로 복원.

   설계 변경 이력:
   - 이전에는 compact에서 SNS 카드를 보기 전용으로 두고 편집/생성은
     데스크톱에서만 하도록 했으나, compact에서도 SNS 작성이 필요하다는
     요구로 데스크톱 SnsLogCard의 편집 로직을 좁은 폭에 맞춰 이식함.
   - "업로드"(SNS 페이지 게시) 액션은 compact에 두지 않음 — 별도 SNS
     페이지 흐름이며 이번 범위가 아님. compact는 캡션·미디어 작성까지.

   콜백이 없을 때의 동작:
   - onSave 미지정  → 편집 버튼 숨김 (순수 보기 전용으로 동작, 기존과 동일).
   - onDelete 미지정 → 삭제 버튼 숨김.

   데이터는 CompactSnsLogData (caption + media[]), 데스크톱 SnsLogData와
   동일 구조. 미디어 id는 crypto.randomUUID로 부여.
*/

interface CompactSnsLogCardProps {
  /** SNS 게시물 데이터 (캡션 + 미디어) */
  data: CompactSnsLogData;
  /**
   * 편집 저장 콜백. 편집 모드 "저장" 시 호출.
   * 미지정 시 편집 버튼이 숨겨져 보기 전용으로 동작.
   */
  onSave?: (data: CompactSnsLogData) => void;
  /**
   * 카드 삭제 콜백. 헤더 "×" → 확인 모달 → 호출.
   * 미지정 시 삭제 버튼이 숨겨짐.
   */
  onDelete?: () => void;
  /** 추가 클래스 */
  className?: string;
}

export default function CompactSnsLogCard({
  data,
  onSave,
  onDelete,
  className = "",
}: CompactSnsLogCardProps) {
  const { caption, media } = data;

  /* 편집 모드 여부 */
  const [isEditing, setIsEditing] = useState(false);
  /* 삭제 확인 모달 */
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /* 편집 중 임시 데이터 */
  const [draft, setDraft] = useState<CompactSnsLogData>({
    caption,
    media: media ?? [],
  });

  /* 캐러셀 현재 인덱스 — media 길이를 초과할 수 있어 렌더 시 보정 */
  const [carouselIndex, setCarouselIndex] = useState(0);

  /* 편집 중 새로 만든 ObjectURL 추적 (메모리 누수 방지) */
  const objectUrlsRef = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* 언마운트 시 ObjectURL 정리 */
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    };
  }, []);

  const mediaLength = media?.length ?? 0;
  const safeIndex =
    mediaLength === 0 ? 0 : Math.min(carouselIndex, mediaLength - 1);
  const current = mediaLength > 0 ? media[safeIndex] : null;

  /* ── 모드 전환 ── */
  const enterEditMode = () => {
    setDraft({ caption, media: media ?? [] });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    /* 편집 중 추가한 ObjectURL 모두 revoke (저장 안 했으므로 전부 폐기) */
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current = [];
    setIsEditing(false);
  };

  const saveEdit = () => {
    const cleaned: CompactSnsLogData = {
      caption: draft.caption?.trim() || undefined,
      media: draft.media,
    };

    /* 편집 중 추가했지만 저장 시 draft.media에서 빠진 ObjectURL은 즉시 revoke.
       저장된 media에 남은 URL은 보기 모드에서 계속 쓰이므로 추적 유지
       → 언마운트 cleanup에서 해제. (데스크톱 SnsLogCard와 동일 패턴) */
    const stillInUse = new Set(draft.media.map((m) => m.url));
    objectUrlsRef.current
      .filter((url) => !stillInUse.has(url))
      .forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current = objectUrlsRef.current.filter((url) =>
      stillInUse.has(url),
    );

    onSave?.(cleaned);
    setIsEditing(false);
  };

  /* ── 미디어 추가/삭제 (편집 모드) ── */
  const handlePickMedia = () => fileInputRef.current?.click();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newMedia: CompactSnsMedia[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      objectUrlsRef.current.push(url);
      newMedia.push({
        /* crypto.randomUUID는 secure context(HTTPS/localhost)에서 동작 —
           Vite 개발 서버 및 프로덕션 HTTPS 모두 OK */
        id: crypto.randomUUID(),
        type: file.type.startsWith("video/") ? "video" : "image",
        url,
      });
    }
    setDraft((prev) => ({ ...prev, media: [...prev.media, ...newMedia] }));
    e.target.value = "";
  };

  const handleRemoveMedia = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      media: prev.media.filter((m) => m.id !== id),
    }));
  };

  return (
    <article
      className={[
        "bg-white rounded-xl border border-gray-300 overflow-hidden",
        "flex flex-col",
        isEditing ? "shadow-md" : "",
        className,
      ].join(" ")}
    >
      {/* ── 헤더 ── */}
      <header className="shrink-0 flex items-center gap-2 px-4 py-3.5 border-b border-gray-100">
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-gray-900 text-body5 font-semibold shrink-0"
          aria-hidden="true"
        >
          S
        </span>
        <span className="font-pretendard text-body2 font-semibold text-gray-900">
          SNS 게시물
        </span>

        {/* 우측 버튼 영역 */}
        <div className="ml-auto flex items-center gap-1 shrink-0">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={cancelEdit}
                className={[
                  "px-2.5 py-1 rounded-md",
                  "border border-gray-300 bg-white",
                  "font-pretendard text-body5 text-gray-700",
                  "hover:border-gray-700 transition-colors cursor-pointer",
                ].join(" ")}
              >
                취소
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className={[
                  "px-2.5 py-1 rounded-md",
                  "border border-transparent bg-primary",
                  "font-pretendard text-body5 font-medium text-gray-900",
                  "hover:bg-primary-hover transition-colors cursor-pointer",
                ].join(" ")}
              >
                저장
              </button>
            </>
          ) : (
            <>
              {onSave && (
                <button
                  type="button"
                  onClick={enterEditMode}
                  aria-label="SNS 게시물 편집"
                  className={[
                    "p-1 rounded border-none bg-transparent",
                    "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
                    "transition-colors cursor-pointer",
                    "inline-flex items-center justify-center",
                  ].join(" ")}
                >
                  <Edit2Icon className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  aria-label="SNS 게시물 삭제"
                  className={[
                    "p-1 rounded border-none bg-transparent",
                    "text-gray-500 hover:text-red-600 hover:bg-red-50",
                    "transition-colors cursor-pointer",
                    "inline-flex items-center justify-center",
                  ].join(" ")}
                >
                  <span
                    className="w-4 h-4 inline-flex items-center justify-center text-body1 leading-none"
                    aria-hidden="true"
                  >
                    ×
                  </span>
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {isEditing ? (
        /* ───────── 편집 모드 ───────── */
        <div className="flex flex-col gap-4 p-4">
          {/* 미디어 그리드 */}
          <div className="flex flex-col gap-2">
            <span className="font-pretendard text-body4 font-medium text-gray-500">
              사진 / 영상
            </span>
            <div className="grid grid-cols-3 gap-1.5">
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
                    className={[
                      "absolute top-0.5 right-0.5 w-5 h-5 rounded-full",
                      "bg-gray-900/70 text-white",
                      "inline-flex items-center justify-center",
                      "border-none cursor-pointer",
                    ].join(" ")}
                  >
                    <svg
                      width="9"
                      height="9"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M2 2L10 10M10 2L2 10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                  {m.type === "video" && (
                    <span className="absolute bottom-0.5 left-0.5 px-1 py-0.5 rounded bg-black/60 text-white text-body6 font-medium">
                      영상
                    </span>
                  )}
                </div>
              ))}

              {/* 추가 슬롯 */}
              <button
                type="button"
                onClick={handlePickMedia}
                aria-label="사진 / 영상 추가"
                className={[
                  "aspect-square rounded-md",
                  "border border-dashed border-gray-300 bg-white",
                  "flex flex-col items-center justify-center gap-0.5",
                  "text-gray-400 hover:text-gray-700",
                  "hover:border-gray-700 hover:bg-gray-50",
                  "transition-colors cursor-pointer",
                ].join(" ")}
              >
                <PlusIcon className="w-4 h-4" />
                <span className="font-pretendard text-body6">추가</span>
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
          <div className="flex flex-col gap-2">
            <label
              htmlFor="compact-sns-caption"
              className="font-pretendard text-body4 font-medium text-gray-500"
            >
              내용
            </label>
            <textarea
              id="compact-sns-caption"
              value={draft.caption ?? ""}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, caption: e.target.value }))
              }
              placeholder="SNS에 올릴 글을 작성하세요..."
              rows={4}
              className={[
                "w-full px-3 py-2 rounded-md resize-y",
                "bg-white border border-gray-300",
                "font-pretendard text-body3 text-gray-900 leading-relaxed",
                "placeholder:text-gray-400",
                "outline-none focus:border-gray-700 transition-colors",
              ].join(" ")}
            />
          </div>
        </div>
      ) : (
        /* ───────── 보기 모드 ───────── */
        <>
          {/* 미디어 캐러셀 (정사각형) */}
          <div className="relative w-full aspect-square bg-gray-100">
            {current ? (
              current.type === "image" ? (
                <img
                  src={current.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={current.url}
                  controls
                  className="w-full h-full object-cover bg-black"
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center font-pretendard text-body4 text-gray-400">
                등록된 사진/영상이 없어요
              </div>
            )}

            {/* 좌우 페이지네이션 (미디어 2개 이상일 때만) */}
            {mediaLength > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setCarouselIndex(Math.max(0, safeIndex - 1))}
                  disabled={safeIndex === 0}
                  aria-label="이전 미디어"
                  className={[
                    "absolute left-2 top-1/2 -translate-y-1/2",
                    "w-8 h-8 rounded-full bg-black/40 text-white",
                    "inline-flex items-center justify-center border-none",
                    "hover:bg-black/60 disabled:opacity-30",
                    "transition-colors cursor-pointer",
                  ].join(" ")}
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCarouselIndex(Math.min(mediaLength - 1, safeIndex + 1))
                  }
                  disabled={safeIndex >= mediaLength - 1}
                  aria-label="다음 미디어"
                  className={[
                    "absolute right-2 top-1/2 -translate-y-1/2",
                    "w-8 h-8 rounded-full bg-black/40 text-white",
                    "inline-flex items-center justify-center border-none",
                    "hover:bg-black/60 disabled:opacity-30",
                    "transition-colors cursor-pointer",
                  ].join(" ")}
                >
                  ›
                </button>

                {/* 인디케이터 점 */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
                  {media.map((_, i) => (
                    <span
                      key={i}
                      aria-hidden="true"
                      className={[
                        "h-1.5 rounded-full transition-all",
                        i === safeIndex ? "w-3 bg-white" : "w-1.5 bg-white/60",
                      ].join(" ")}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 캡션 */}
          {caption && (
            <div className="px-4 py-3.5">
              <p className="font-pretendard text-body3 text-gray-900 m-0 whitespace-pre-wrap break-words">
                {caption}
              </p>
            </div>
          )}
        </>
      )}

      {/* 삭제 확인 모달 */}
      <ConfirmPopup
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete?.();
        }}
        title="SNS 게시물을 삭제하시겠어요?"
        description={
          "삭제하면 작성한 캡션과 첨부한 사진/영상이\n모두 사라지며, 되돌릴 수 없습니다."
        }
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="danger"
      />
    </article>
  );
}
