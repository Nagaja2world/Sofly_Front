import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import PlusIcon from "@/assets/plus.svg?react";
import ConfirmPopup from "@/components/common/ConfirmPopup";
import PhotoLightbox from "@/components/workspace/PhotoLightbox";

/* ══════════════════════════════════════════
   타입
   ══════════════════════════════════════════ */

interface SharedAlbumSectionProps {
  /** 공유 앨범에 저장된 사진 URL 배열 */
  photos: string[];
  /**
   * 사진 추가 콜백.
   * 사용자가 "+" 버튼을 눌러 파일을 선택하면 호출됨.
   * 부모는 받은 File들로 업로드 처리 후 state를 갱신해야 함.
   * (현재는 ObjectURL 미리보기 → API 연결 시 FormData 업로드 → 서버 URL 받기)
   */
  onAddPhotos: (files: FileList) => void;
  /**
   * 사진 삭제 콜백.
   * 인덱스를 받아 부모에서 해당 사진을 state에서 제거.
   * (API 연결 시 DELETE 호출)
   */
  onRemovePhoto: (index: number) => void;
  /** 추가 클래스 */
  className?: string;
}

/* ══════════════════════════════════════════
   레이아웃 상수
   ══════════════════════════════════════════ */

/** 한 줄에 보일 사진 수 */
const COLS_PER_ROW = 5;
/** 한 화면에 보일 행 수 (이걸 넘으면 박스 내부에서 세로 스크롤) */
const VISIBLE_ROWS = 3;
/** 사진 셀 사이 간격 (px) — gap-2 = 8px */
const CELL_GAP_PX = 8;

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

/**
 * 워크스페이스 페이지의 "공유 앨범" 섹션
 *
 * - "여행 기록" 섹션 바로 아래에 위치
 * - 여행에서 함께 놀러 간 사람들이 찍은 사진들을 모아두는 공간
 * - 5열 × 3행(=15장)이 한 화면에 보이고, 그 이상이면 박스 내부에서 세로 스크롤
 * - 사진 클릭 시 라이트박스 모달이 열려 확대 보기 (좌우 화살표로 다른 사진 둘러보기)
 * - 사진 hover 시 우상단 "×" 버튼 → 삭제 확인 모달 → 확정 시 부모 콜백
 * - 섹션 헤더의 "+" 버튼 / 빈 상태 placeholder 둘 다에서 사진 업로드 가능
 *
 * 디자인 스펙
 * - 워크스페이스 다른 카드들과 동일한 시각 언어 (rounded-xl, gray-300 border, Pretendard)
 * - 사진은 정사각형(aspect-square) — 시각적 일관성을 위해 cover crop
 * - 사진이 없을 때는 dashed placeholder + 가운데 "+" 버튼 안내
 */
export default function SharedAlbumSection({
  photos,
  onAddPhotos,
  onRemovePhoto,
  className = "",
}: SharedAlbumSectionProps) {
  /** 라이트박스에서 보여줄 사진 인덱스. null이면 닫힘 */
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  /** 삭제 확인 대상 인덱스. null이면 모달 닫힘 */
  const [deleteTargetIndex, setDeleteTargetIndex] = useState<number | null>(
    null,
  );

  /** 파일 선택 input (숨김) */
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── 사진 추가 ── */
  const triggerFilePicker = () => fileInputRef.current?.click();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddPhotos(e.target.files);
      /* 같은 파일을 다시 선택해도 onChange 발생하도록 reset */
      e.target.value = "";
    }
  };

  /* ── 사진 삭제 ── */
  const handleConfirmDelete = () => {
    if (deleteTargetIndex !== null) {
      onRemovePhoto(deleteTargetIndex);
    }
    setDeleteTargetIndex(null);
  };

  /* ── 사진 개수 변화에 따른 라이트박스 인덱스 보정 ──
     사진을 삭제하면 lightboxIndex가 photos 배열 범위를 벗어날 수 있음.
     useEffect + setState로 보정하면 cascading render가 발생하므로,
     렌더 중에 파생값으로 계산해서 PhotoLightbox에 안전한 인덱스를 넘긴다.

     - 라이트박스가 닫혀있거나(null) 사진이 0장이면 → null (닫힘)
     - 인덱스가 범위를 벗어나면 → 마지막 사진 인덱스로 clamp
     - 그 외엔 그대로 사용

     주의: 이 값은 PhotoLightbox에 props로만 전달되고, state(lightboxIndex)
     자체는 보정하지 않음. 사진이 다시 늘어나면 원래 인덱스가 다시 유효해지므로
     "기억된 위치"가 유지되는 이점이 있음. */
  const safeLightboxIndex =
    lightboxIndex === null || photos.length === 0
      ? null
      : Math.min(lightboxIndex, photos.length - 1);

  const hasPhotos = photos.length > 0;

  return (
    <section className={`flex flex-col gap-3 ${className}`}>
      {/* ── 섹션 헤더: "공유 앨범" + "+" 버튼 ──
          여행 기록 섹션 헤더와 동일한 타이포/사이즈 사용 (페이지 내 시각 일관성) */}
      <div className="flex items-center gap-2">
        <h2 className="font-pretendard text-title2 font-semibold text-gray-900 m-0">
          공유 앨범
        </h2>
        <button
          type="button"
          onClick={triggerFilePicker}
          aria-label="공유 앨범에 사진 추가"
          className={[
            "inline-flex items-center justify-center",
            "w-8 h-8 rounded-full transition-colors border-none bg-transparent",
            "text-gray-600 hover:bg-gray-100 hover:text-gray-900 cursor-pointer",
          ].join(" ")}
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>

      {/* ── 앨범 박스 ──
          - 흰 배경 + 카드 스타일 (다른 워크스페이스 카드들과 통일)
          - 사진이 있을 때: 5×3 그리드, 16:9 정도의 박스 안에서 세로 스크롤
          - 사진이 없을 때: dashed placeholder + 안내 메시지 */}
      <div
        className={["rounded-xl border border-gray-300 bg-white", "p-4"].join(
          " ",
        )}
      >
        {hasPhotos ? (
          <PhotoGrid
            photos={photos}
            onPhotoClick={(i) => setLightboxIndex(i)}
            onPhotoRemove={(i) => setDeleteTargetIndex(i)}
            onAddClick={triggerFilePicker}
          />
        ) : (
          <EmptyAlbumPlaceholder onAddClick={triggerFilePicker} />
        )}
      </div>

      {/* 사진 추가용 file input (보이지 않음) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        aria-label="공유 앨범에 추가할 사진 선택"
      />

      {/* 사진 확대 보기 라이트박스
          safeLightboxIndex는 photos 길이에 맞춰 clamp된 파생값. 사진이 삭제되어도
          항상 유효한 인덱스가 들어가므로 PhotoLightbox 내부 보정 로직과 무관하게
          이중으로 안전. */}
      <PhotoLightbox
        photos={photos}
        index={safeLightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
        alt="공유 앨범"
      />

      {/* 사진 삭제 확인 모달 */}
      <ConfirmPopup
        isOpen={deleteTargetIndex !== null}
        onClose={() => setDeleteTargetIndex(null)}
        onConfirm={handleConfirmDelete}
        title="사진을 삭제하시겠어요?"
        description={
          "공유 앨범에서 해당 사진이 제거됩니다.\n되돌릴 수 없습니다."
        }
      />
    </section>
  );
}

/* ══════════════════════════════════════════
   서브 컴포넌트
   ══════════════════════════════════════════ */

/**
 * 5×3 사진 그리드 + 마지막에 "+" 슬롯
 *
 * 높이 계산 전략:
 * - 셀은 aspect-square라서 셀 폭이 정해지면 높이가 자동으로 정사각형
 * - 컨테이너 폭은 부모에 따라 변동되므로 ResizeObserver로 폭 추적
 * - 한 셀 폭 = (컨테이너 폭 - 4 * gap) / 5
 * - 3행 박스 높이 = 3 * 셀폭 + 2 * gap
 * - 이 높이를 max-height로 적용해 정확히 3행만 보이게 하고,
 *   사진이 더 있으면 박스 내부에서 세로 스크롤됨.
 *
 * 사진 + "+" 슬롯 합쳐서 15칸 이하면 max-height를 두지 않음 (어차피 다 보이므로).
 */
function PhotoGrid({
  photos,
  onPhotoClick,
  onPhotoRemove,
  onAddClick,
}: {
  photos: string[];
  onPhotoClick: (index: number) => void;
  onPhotoRemove: (index: number) => void;
  onAddClick: () => void;
}) {
  /** 스크롤 컨테이너 ref (폭 측정용) */
  const containerRef = useRef<HTMLDivElement>(null);
  /** 측정된 컨테이너 폭 — 초기에는 undefined로 두고, 측정 완료 후 px값 들어옴 */
  const [containerWidth, setContainerWidth] = useState<number | undefined>(
    undefined,
  );

  /** 3행을 초과해야 스크롤이 의미 있음. 사진 수 + 1(추가 슬롯) 기준 */
  const needsScroll = photos.length + 1 > COLS_PER_ROW * VISIBLE_ROWS;

  /* ResizeObserver로 컨테이너 폭 추적
     - 좌/우 사이드바 토글 시 컨테이너 폭이 바뀌므로 동적으로 반응해야 함
     - needsScroll이 false일 땐 observer를 붙이지 않고 그대로 둠.
       containerWidth state는 stale하게 남지만, 어차피 maxHeightPx 계산에서
       needsScroll이 false면 사용되지 않으므로 문제 없음.
       (setState(undefined)로 명시적으로 비우면 cascading render가 발생함) */
  useEffect(() => {
    if (!needsScroll) return;
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => setContainerWidth(el.clientWidth);
    updateWidth(); // 초기 측정

    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, [needsScroll]);

  /** 3행 박스 높이 계산. 폭이 측정되기 전엔 undefined → 그땐 max-height 미적용 */
  const maxHeightPx =
    needsScroll && containerWidth !== undefined
      ? (() => {
          const cellWidth =
            (containerWidth - (COLS_PER_ROW - 1) * CELL_GAP_PX) / COLS_PER_ROW;
          return cellWidth * VISIBLE_ROWS + (VISIBLE_ROWS - 1) * CELL_GAP_PX;
        })()
      : undefined;

  return (
    <div
      ref={containerRef}
      className={[
        "w-full",
        needsScroll ? "overflow-y-auto pr-1" : "",
        // 스크롤바 스타일 (다른 카드들과 동일한 패턴)
        "[&::-webkit-scrollbar]:w-1.5",
        "[&::-webkit-scrollbar-thumb]:bg-gray-300",
        "[&::-webkit-scrollbar-thumb]:rounded",
        "[&::-webkit-scrollbar-track]:bg-transparent",
      ].join(" ")}
      style={maxHeightPx !== undefined ? { maxHeight: maxHeightPx } : undefined}
    >
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${COLS_PER_ROW}, minmax(0, 1fr))`,
        }}
      >
        {photos.map((src, i) => (
          <PhotoCell
            key={`${src}-${i}`}
            src={src}
            index={i}
            onClick={() => onPhotoClick(i)}
            onRemove={() => onPhotoRemove(i)}
          />
        ))}

        {/* 마지막에 "+" 슬롯 (사진 추가) — 항상 가장 마지막 셀로 들어감 */}
        <AddPhotoCell onClick={onAddClick} />
      </div>
    </div>
  );
}

/**
 * 사진 한 장 셀
 * - hover 시 어둡게 + 우상단 × 버튼 노출
 * - 클릭 시 라이트박스 열기 (단, × 버튼 클릭은 stopPropagation으로 분리)
 */
function PhotoCell({
  src,
  index,
  onClick,
  onRemove,
}: {
  src: string;
  index: number;
  onClick: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-200 group">
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
          className={[
            "w-full h-full object-cover",
            "transition-transform duration-200",
            "group-hover:scale-105",
          ].join(" ")}
          loading="lazy"
        />
      </button>

      {/* hover 시 어둡게 깔리는 오버레이 (× 버튼 가독성 ↑) */}
      <div
        className={[
          "absolute inset-0 pointer-events-none",
          "bg-black/0 group-hover:bg-black/15 transition-colors",
        ].join(" ")}
        aria-hidden="true"
      />

      {/* 우상단 × 삭제 버튼 — 항상 DOM에 존재하되 hover 시 노출 */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label={`공유 앨범 사진 ${index + 1} 삭제`}
        className={[
          "absolute top-1.5 right-1.5",
          "w-7 h-7 rounded-full",
          "inline-flex items-center justify-center",
          "bg-gray-900/70 text-white",
          "border-none cursor-pointer",
          "opacity-0 group-hover:opacity-100 focus:opacity-100",
          "transition-opacity",
          "hover:bg-gray-900/90",
        ].join(" ")}
      >
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path
            d="M2 2L10 10M10 2L2 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

/**
 * 그리드 마지막 "+" 슬롯 — 사진 추가 진입점
 * (헤더의 "+" 버튼과 동일 동작이지만, 그리드 안에 두면 사용자가 더 자연스럽게 발견)
 */
function AddPhotoCell({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="공유 앨범에 사진 추가"
      className={[
        "aspect-square rounded-lg",
        "border border-dashed border-gray-300 bg-white",
        "text-gray-500 hover:text-gray-900 hover:border-gray-700 hover:bg-gray-50",
        "transition-colors cursor-pointer",
        "inline-flex items-center justify-center",
      ].join(" ")}
    >
      <PlusIcon className="w-6 h-6" />
    </button>
  );
}

/**
 * 사진이 한 장도 없을 때 보이는 placeholder
 * - 공유 앨범의 용도를 짧게 안내 + 가운데 "+" 버튼
 */
function EmptyAlbumPlaceholder({ onAddClick }: { onAddClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onAddClick}
      className={[
        "w-full",
        "py-16 px-6 rounded-lg",
        "border-2 border-dashed border-gray-300",
        "bg-gray-50 hover:bg-gray-100 hover:border-gray-400",
        "transition-colors cursor-pointer",
        "flex flex-col items-center justify-center gap-3",
        "focus-visible:outline-none focus-visible:border-gray-700",
      ].join(" ")}
      aria-label="공유 앨범에 첫 사진 추가하기"
    >
      <span
        className={[
          "inline-flex items-center justify-center",
          "w-12 h-12 rounded-full",
          "bg-white text-gray-700",
        ].join(" ")}
        aria-hidden="true"
      >
        <PlusIcon className="w-6 h-6" />
      </span>
      <PlaceholderText>
        <span className="font-pretendard text-body1 font-semibold text-gray-900">
          첫 사진을 공유해보세요
        </span>
        <span className="font-pretendard text-body4 text-gray-500">
          여행에서 함께 찍은 사진을 모아둘 수 있어요
        </span>
      </PlaceholderText>
    </button>
  );
}

/** placeholder 텍스트 묶음 (의미상 그룹) */
function PlaceholderText({ children }: { children: ReactNode }) {
  return <span className="flex flex-col items-center gap-1">{children}</span>;
}
