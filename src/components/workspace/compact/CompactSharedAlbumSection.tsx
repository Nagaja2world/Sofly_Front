import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import PlusIcon from "@/assets/plus.svg?react";
import ConfirmPopup from "@/components/common/ConfirmPopup";
import PhotoLightbox from "@/components/workspace/PhotoLightbox";
import { type AlbumPhoto } from "@/api/albumApi";

/* ══════════════════════════════════════════
   CompactSharedAlbumSection
   ══════════════════════════════════════════
   좁은 화면(< 768px)용 공유 앨범 섹션.

   데스크톱 SharedAlbumSection과의 차이:
   - 데스크톱: 5열 그리드, 3행(15장) 초과 시 박스 내부 세로 스크롤.
   - 좁은 화면: 3열 그리드. 모바일 폭에서 5열은 셀이 너무 작아짐.
     · 처음에는 INITIAL_ROWS(4행=12장)까지만 보여주고,
       그 이상은 "더보기" 버튼으로 점진적으로 펼침.
     · 박스 내부 스크롤(데스크톱 방식)은 모바일에서 페이지 스크롤과
       충돌해 조작이 어려우므로 "더보기"로 펼치는 방식을 택함.
   - 라이트박스·삭제 확인 모달·숨김 file input은 데스크톱과 동일하게 재사용.

   데이터 흐름 (WorkspacePage 호출부 기준 — 최신):
   - photos: AlbumPhoto[] (id/url 등을 가진 객체 배열)
   - 삭제/다운로드는 photoId(number)로 식별 — index가 아님.
   - uploading: 업로드 진행 중 (헤더 + 버튼 비활성/스피너 표시)
   - hasNext/loadingMore/onLoadMore: 서버 페이지네이션.
     화면에 보여줄 분량을 다 펼쳤고 서버에 더 있으면 onLoadMore 호출.

   "더보기" 버튼의 두 가지 역할:
   1) 클라이언트가 이미 받아온 사진 중 아직 안 보여준 행을 펼침.
   2) 받아온 걸 다 펼쳤는데 서버에 더 있으면(hasNext) onLoadMore로
      다음 페이지를 요청. (요청 중에는 loadingMore로 스피너)
*/

interface CompactSharedAlbumSectionProps {
  /** 공유 앨범 사진 (AlbumPhoto 객체 배열) */
  photos: AlbumPhoto[];
  /** 업로드 진행 중 여부 */
  uploading: boolean;
  /** 서버에 더 불러올 페이지가 있는지 */
  hasNext: boolean;
  /** 다음 페이지 로딩 중 여부 */
  loadingMore: boolean;
  /**
   * 사진 추가 콜백.
   * "+" 버튼으로 파일을 선택하면 FileList로 호출됨.
   */
  onAddPhotos: (files: FileList) => void;
  /**
   * 사진 삭제 콜백 — photoId 기반 (index 아님).
   * 데스크톱과 동일하게 WorkspacePage.handleRemoveSharedPhoto로 연결.
   */
  onRemovePhoto: (photoId: number) => void;
  /** 사진 다운로드 콜백 — photoId 기반. */
  onDownloadPhoto: (photoId: number) => void;
  /** 다음 페이지 요청 콜백. */
  onLoadMore: () => void;
  /** 추가 클래스 */
  className?: string;
}

/* ══════════════════════════════════════════
   레이아웃 상수
   ══════════════════════════════════════════ */

/** 한 줄에 보일 사진 수 (모바일 — 데스크톱 5열 대비 좁힘) */
const COLS_PER_ROW = 3;
/** 처음에 보여줄 행 수 (이 행 수 × 열 수 = 초기 표시 장수) */
const INITIAL_ROWS = 4;
/** "더보기" 한 번에 추가로 펼치는 행 수 */
const ROWS_PER_EXPAND = 4;

/** 초기 표시 장수 */
const INITIAL_VISIBLE = COLS_PER_ROW * INITIAL_ROWS;
/** "더보기" 1회당 추가 표시 장수 */
const EXPAND_STEP = COLS_PER_ROW * ROWS_PER_EXPAND;

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

export default function CompactSharedAlbumSection({
  photos,
  uploading,
  hasNext,
  loadingMore,
  onAddPhotos,
  onRemovePhoto,
  onDownloadPhoto,
  onLoadMore,
  className = "",
}: CompactSharedAlbumSectionProps) {
  /** 라이트박스에서 보여줄 사진 인덱스. null이면 닫힘 */
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  /** 삭제 확인 대상 photoId. null이면 모달 닫힘 */
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  /** 현재 화면에 펼쳐 보여줄 사진 수 (더보기로 증가) */
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  /** 파일 선택 input (숨김) */
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── 사진 추가 ── */
  const triggerFilePicker = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddPhotos(e.target.files);
      /* 같은 파일을 다시 선택해도 onChange가 발생하도록 reset */
      e.target.value = "";
    }
  };

  /* ── 사진 삭제 ── */
  const handleConfirmDelete = () => {
    if (deleteTargetId !== null) {
      onRemovePhoto(deleteTargetId);
    }
    setDeleteTargetId(null);
  };

  /* ── 더보기 ──
     1) 클라이언트가 받아온 사진 중 아직 안 펼친 게 있으면 visibleCount 증가.
     2) 받아온 걸 다 펼쳤는데 서버에 더 있으면 다음 페이지 요청.
     비교는 clamp된 effectiveVisibleCount 기준 (아래 정의). */
  const handleShowMore = () => {
    if (effectiveVisibleCount < photos.length) {
      setVisibleCount(
        Math.min(effectiveVisibleCount + EXPAND_STEP, photos.length),
      );
    } else if (hasNext && !loadingMore) {
      onLoadMore();
    }
  };

  /* 라이트박스용 URL 배열 — PhotoLightbox가 string[]을 받으므로 매핑.
     라이트박스는 "전체 사진"을 둘러보므로 visibleCount로 자르지 않고
     받아온 photos 전체를 넘김. */
  const photoUrls = photos.map((p) => p.url);

  /* 사진 개수 변화에 따른 라이트박스 인덱스 보정 (데스크톱과 동일 전략).
     삭제로 인덱스가 범위를 벗어나면 마지막 사진으로 clamp. */
  const safeLightboxIndex =
    lightboxIndex === null || photos.length === 0
      ? null
      : Math.min(lightboxIndex, photos.length - 1);

  const hasPhotos = photos.length > 0;

  /* visibleCount 보정 — 렌더 중 파생값으로 계산 (effect + setState 금지).
     사진이 삭제되면 visibleCount가 photos.length를 넘을 수 있고,
     반대로 INITIAL_VISIBLE보다 작아질 일은 없지만 방어적으로 floor도 둠.

     중요: state(visibleCount) 자체는 보정하지 않음.
     - effect 안에서 setVisibleCount를 부르면 cascading render 경고 발생.
       (safeLightboxIndex와 동일하게, 파생값만 clamp하는 패턴으로 회피)
     - state를 건드리지 않으므로, 사진을 지웠다가 다시 추가하면
       "사용자가 더보기로 펼쳐둔 양"이 그대로 복원되는 이점도 있음. */
  const effectiveVisibleCount = Math.min(
    Math.max(visibleCount, Math.min(INITIAL_VISIBLE, photos.length)),
    photos.length,
  );

  /* 화면에 실제로 그릴 사진 (clamp된 파생값까지 자름) */
  const shownPhotos = photos.slice(0, effectiveVisibleCount);

  /* "더보기" 버튼 노출 여부 —
     아직 안 펼친 사진이 있거나, 서버에 다음 페이지가 있을 때. */
  const canShowMore = effectiveVisibleCount < photos.length || hasNext;

  return (
    <section className={`flex flex-col gap-3 ${className}`}>
      {/* ── 섹션 헤더: "공유 앨범" + 인원수 느낌의 카운트 + "+" 버튼 ──
          다른 compact 섹션 헤더와 동일한 text-body1 굵게. */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-pretendard text-body1 font-semibold text-gray-900 m-0">
          공유 앨범
        </h2>
        <button
          type="button"
          onClick={triggerFilePicker}
          disabled={uploading}
          aria-label="공유 앨범에 사진 추가"
          className={[
            "inline-flex items-center justify-center gap-1.5",
            "h-8 px-3 rounded-full transition-colors border-none",
            uploading
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 cursor-pointer",
          ].join(" ")}
        >
          {uploading ? (
            <>
              <Spinner />
              <span className="font-pretendard text-body4 font-medium">
                업로드 중
              </span>
            </>
          ) : (
            <>
              <PlusIcon className="w-4 h-4" />
              <span className="font-pretendard text-body4 font-medium">
                사진 추가
              </span>
            </>
          )}
        </button>
      </div>

      {/* ── 앨범 박스 ── */}
      <div className="rounded-xl border border-gray-300 bg-white p-3">
        {hasPhotos ? (
          <div className="flex flex-col gap-3">
            {/* 3열 사진 그리드 */}
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${COLS_PER_ROW}, minmax(0, 1fr))`,
              }}
            >
              {shownPhotos.map((photo, i) => (
                <PhotoCell
                  key={photo.id}
                  src={photo.url}
                  index={i}
                  onClick={() => setLightboxIndex(i)}
                  onRemove={() => setDeleteTargetId(photo.id)}
                  onDownload={() => onDownloadPhoto(photo.id)}
                />
              ))}

              {/* 마지막에 "+" 슬롯 — 받아온 사진을 다 펼쳤을 때만 노출.
                  (아직 더보기로 펼칠 게 남아 있으면 그리드 끝이 아니므로 생략) */}
              {effectiveVisibleCount >= photos.length && (
                <AddPhotoCell
                  onClick={triggerFilePicker}
                  disabled={uploading}
                />
              )}
            </div>

            {/* 더보기 버튼 */}
            {canShowMore && (
              <button
                type="button"
                onClick={handleShowMore}
                disabled={loadingMore}
                className={[
                  "w-full h-10 rounded-lg",
                  "font-pretendard text-body4 font-medium",
                  "border border-gray-300 bg-white",
                  "inline-flex items-center justify-center gap-1.5",
                  loadingMore
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-50 hover:border-gray-700 cursor-pointer",
                  "transition-colors",
                ].join(" ")}
              >
                {loadingMore ? (
                  <>
                    <Spinner />
                    불러오는 중
                  </>
                ) : (
                  "사진 더보기"
                )}
              </button>
            )}
          </div>
        ) : (
          <EmptyAlbumPlaceholder
            onAddClick={triggerFilePicker}
            disabled={uploading}
          />
        )}
      </div>

      {/* 사진 추가용 file input (숨김) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        aria-label="공유 앨범에 추가할 사진 선택"
      />

      {/* 사진 확대 보기 라이트박스 — 데스크톱과 동일 컴포넌트 재사용.
          PhotoLightbox는 URL 배열을 받으므로 photoUrls를 넘김. */}
      <PhotoLightbox
        photos={photoUrls}
        index={safeLightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
        alt="공유 앨범"
      />

      {/* 사진 삭제 확인 모달 */}
      <ConfirmPopup
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="사진을 삭제하시겠어요?"
        description={
          "공유 앨범에서 해당 사진이 제거됩니다.\n되돌릴 수 없습니다."
        }
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="danger"
      />
    </section>
  );
}

/* ══════════════════════════════════════════
   서브 컴포넌트
   ══════════════════════════════════════════ */

/** 작은 로딩 스피너 (업로드/더보기 진행 표시) */
function Spinner() {
  return (
    <span
      className="inline-block w-3.5 h-3.5 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin"
      aria-hidden="true"
    />
  );
}

/**
 * 사진 한 장 셀
 * - 데스크톱은 hover로 × 버튼을 노출하지만, 모바일은 hover가 없음.
 *   → 우상단 × (삭제) / 우하단 ↓ (다운로드) 버튼을 항상 표시.
 * - 사진 본문 탭 → 라이트박스. 버튼 탭은 stopPropagation으로 분리.
 */
function PhotoCell({
  src,
  index,
  onClick,
  onRemove,
  onDownload,
}: {
  src: string;
  index: number;
  onClick: () => void;
  onRemove: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-200">
      {/* 사진 영역 — 버튼으로 만들어 키보드 접근 가능 */}
      <button
        type="button"
        onClick={onClick}
        aria-label={`공유 앨범 사진 ${index + 1} 확대 보기`}
        className={[
          "w-full h-full block",
          "border-none bg-transparent p-0",
          "cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        ].join(" ")}
      >
        <img
          src={src}
          alt={`공유 앨범 사진 ${index + 1}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </button>

      {/* 우상단 × 삭제 버튼 — 모바일은 hover가 없어 항상 표시 */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label={`공유 앨범 사진 ${index + 1} 삭제`}
        className={[
          "absolute top-1 right-1",
          "w-6 h-6 rounded-full",
          "inline-flex items-center justify-center",
          "bg-gray-900/70 text-white",
          "border-none cursor-pointer",
          "active:bg-gray-900/90",
        ].join(" ")}
      >
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path
            d="M2 2L10 10M10 2L2 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* 우하단 ↓ 다운로드 버튼 */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDownload();
        }}
        aria-label={`공유 앨범 사진 ${index + 1} 다운로드`}
        className={[
          "absolute bottom-1 right-1",
          "w-6 h-6 rounded-full",
          "inline-flex items-center justify-center",
          "bg-gray-900/70 text-white",
          "border-none cursor-pointer",
          "active:bg-gray-900/90",
        ].join(" ")}
      >
        <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path
            d="M7 2v7M7 9L4 6M7 9l3-3M2.5 11.5h9"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

/**
 * 그리드 마지막 "+" 슬롯 — 사진 추가 진입점
 */
function AddPhotoCell({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="공유 앨범에 사진 추가"
      className={[
        "aspect-square rounded-lg",
        "border border-dashed border-gray-300 bg-white",
        "inline-flex items-center justify-center",
        "transition-colors",
        disabled
          ? "text-gray-300 cursor-not-allowed"
          : "text-gray-500 hover:text-gray-900 hover:border-gray-700 hover:bg-gray-50 cursor-pointer",
      ].join(" ")}
    >
      <PlusIcon className="w-6 h-6" />
    </button>
  );
}

/**
 * 사진이 한 장도 없을 때 보이는 placeholder
 */
function EmptyAlbumPlaceholder({
  onAddClick,
  disabled,
}: {
  onAddClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onAddClick}
      disabled={disabled}
      className={[
        "w-full",
        "py-10 px-6 rounded-lg",
        "border-2 border-dashed border-gray-300",
        "bg-gray-50",
        "flex flex-col items-center justify-center gap-3",
        "transition-colors",
        "focus-visible:outline-none focus-visible:border-gray-700",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "hover:bg-gray-100 hover:border-gray-400 cursor-pointer",
      ].join(" ")}
      aria-label="공유 앨범에 첫 사진 추가하기"
    >
      <span
        className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white text-gray-700"
        aria-hidden="true"
      >
        <PlusIcon className="w-6 h-6" />
      </span>
      <PlaceholderText>
        <span className="font-pretendard text-body3 font-semibold text-gray-900">
          첫 사진을 공유해보세요
        </span>
        <span className="font-pretendard text-body4 text-gray-500">
          여행에서 함께 찍은 사진을 모아둘 수 있어요
        </span>
      </PlaceholderText>
    </button>
  );
}

/** placeholder 텍스트 묶음 */
function PlaceholderText({ children }: { children: ReactNode }) {
  return (
    <span className="flex flex-col items-center gap-1 text-center">
      {children}
    </span>
  );
}
