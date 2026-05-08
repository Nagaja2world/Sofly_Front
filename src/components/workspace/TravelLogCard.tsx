import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import PinIcon from "@/assets/pin.svg?react";
import PlusIcon from "@/assets/plus.svg?react";
import SunPressedIcon from "@/assets/sun_pressed.svg?react";
import SunIcon from "@/assets/sun.svg?react";
import CloudPressedIcon from "@/assets/cloud_pressed.svg?react";
import CloudIcon from "@/assets/cloud.svg?react";
import CloudRainingPressedIcon from "@/assets/cloud-raining_pressed.svg?react";
import CloudRainingIcon from "@/assets/cloud-raining.svg?react";
import SnowPressedIcon from "@/assets/snow_pressed.svg?react";
import SnowIcon from "@/assets/snow.svg?react";

/* ══════════════════════════════════════════
   타입
   ══════════════════════════════════════════ */

/** 날씨 종류 (한 줄 여행 우측 아이콘 4개 중 하나가 활성화) */
export type WeatherType = "sunny" | "cloudy" | "rainy" | "snowy";

/** 편집 모드에서 부모로 전달되는 데이터 묶음
 *  - 보기 모드 props와 동일 형태이므로, 부모는 그대로 받아서 state에 머지하면 됨
 *  - photo는 string[] (URL 또는 createObjectURL 결과). API 연결 시
 *    File 업로드 → 서버 URL 받기 → setState로 갱신하는 흐름으로 바꾸면 됨 */
export interface TravelLogData {
  oneLineSummary?: string;
  weather?: WeatherType;
  body?: string;
  bodyPhotos?: string[];
  bodyClosing?: string;
  albumPhotos?: string[];
}

interface TravelLogCardProps {
  /** 일차 번호 */
  dayNumber: number;
  /** 한 줄 여행 텍스트 "프랑크푸르트 여행 1일차, 날씨가 다웠다." */
  oneLineSummary?: string;
  /** 한 줄 여행 우측 날씨 (선택된 1개) */
  weather?: WeatherType;
  /** 본문 텍스트 (긴 줄거리) */
  body?: string;
  /** 본문 중간에 들어가는 사진들 (3장 정도) */
  bodyPhotos?: string[];
  /** 본문 마지막 한 줄 (예: "이후 호텔에 체크인하며 하루를 마무리했다.") */
  bodyClosing?: string;
  /** 앨범 사진들 */
  albumPhotos?: string[];
  /**
   * 편집 저장 콜백.
   * "더보기" → 편집 모드 → "저장" 누르면 호출됨.
   * 부모는 받은 data로 state를 갱신하면 됨. (API 연결 시 PATCH)
   */
  onSave?: (data: TravelLogData) => void;
  /** 추가 클래스 */
  className?: string;
}

/* ══════════════════════════════════════════
   공용 서브 컴포넌트
   ══════════════════════════════════════════ */

/** 날씨 종류 정의 (편집/보기 공용) */
const WEATHER_TYPES: WeatherType[] = ["sunny", "cloudy", "rainy", "snowy"];

const WEATHER_LABEL: Record<WeatherType, string> = {
  sunny: "맑음",
  cloudy: "흐림",
  rainy: "비",
  snowy: "눈",
};

/**
 * 날씨 아이콘 1개 렌더링 (보기/편집 모두에서 재사용)
 *
 * - active=true → *-pressed (색상 채워진) 아이콘
 * - active=false → 기본(흑백) 아이콘
 */
function WeatherIcon({
  type,
  active,
  className = "",
}: {
  type: WeatherType;
  active: boolean;
  className?: string;
}) {
  const cls = ["w-6 h-6", className].join(" ");
  if (type === "sunny")
    return active ? (
      <SunPressedIcon className={cls} />
    ) : (
      <SunIcon className={cls} />
    );
  if (type === "cloudy")
    return active ? (
      <CloudPressedIcon className={cls} />
    ) : (
      <CloudIcon className={cls} />
    );
  if (type === "rainy")
    return active ? (
      <CloudRainingPressedIcon className={cls} />
    ) : (
      <CloudRainingIcon className={cls} />
    );
  return active ? (
    <SnowPressedIcon className={cls} />
  ) : (
    <SnowIcon className={cls} />
  );
}

/** 보기 모드: 날씨 4개 (선택된 1개만 pressed) */
function WeatherIconGroupView({ weather }: { weather?: WeatherType }) {
  return (
    <div className="flex items-center gap-1">
      {WEATHER_TYPES.map((t) => (
        <WeatherIcon key={t} type={t} active={t === weather} />
      ))}
    </div>
  );
}

/** 편집 모드: 날씨 4개를 라디오처럼 클릭하여 토글 */
function WeatherIconGroupEdit({
  weather,
  onChange,
}: {
  weather?: WeatherType;
  onChange: (w: WeatherType | undefined) => void;
}) {
  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label="날씨"
    >
      {WEATHER_TYPES.map((t) => {
        const active = t === weather;
        return (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={WEATHER_LABEL[t]}
            onClick={() => onChange(active ? undefined : t)}
            className={[
              "p-1 rounded-md",
              "inline-flex items-center justify-center",
              "border border-transparent bg-transparent",
              "cursor-pointer transition-colors",
              active ? "bg-gray-200" : "hover:bg-gray-100",
            ].join(" ")}
          >
            <WeatherIcon type={t} active={active} />
          </button>
        );
      })}
    </div>
  );
}

/** 보기 모드 사진 그리드 (3장 가로 배치, 빈 슬롯은 출력 안함) */
function PhotoGridView({ photos, alt }: { photos: string[]; alt: string }) {
  if (!photos || photos.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-2">
      {photos.slice(0, 3).map((src, i) => (
        <div
          key={i}
          className="relative aspect-square rounded-lg overflow-hidden bg-gray-200"
        >
          <img
            src={src}
            alt={`${alt} ${i + 1}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}

/** 섹션 라벨 + 우측 액션 */
function SectionLabel({
  label,
  rightSlot,
}: {
  label: string;
  rightSlot?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 min-h-6">
      <span className="font-pretendard text-body4 font-medium text-gray-500 truncate">
        {label}
      </span>
      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </div>
  );
}

/** 점선 구분선 (좌우 마진 없음 - 카드 풀 너비) */
function DashedDivider() {
  return <div className="border-t border-dashed border-gray-300" />;
}

/* ══════════════════════════════════════════
   편집 모드 전용 서브 컴포넌트
   ══════════════════════════════════════════ */

/** 한 줄 입력 (한 줄 여행, 마무리 한 줄 등) */
function EditTextInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={[
        "w-full px-3 py-2",
        "bg-white border border-gray-300 rounded-md",
        "font-pretendard text-body2 text-gray-900",
        "placeholder:text-gray-500",
        "outline-none focus:border-gray-700 transition-colors",
      ].join(" ")}
    />
  );
}

/** 여러 줄 입력 (본문) */
function EditTextarea({
  value,
  onChange,
  placeholder,
  ariaLabel,
  rows = 5,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      rows={rows}
      className={[
        "w-full px-3 py-2 resize-y",
        "bg-white border border-gray-300 rounded-md",
        "font-pretendard text-body3 text-gray-700 leading-relaxed",
        "placeholder:text-gray-500",
        "outline-none focus:border-gray-700 transition-colors",
      ].join(" ")}
    />
  );
}

/** 사진 그리드 (편집 모드) — 각 사진에 X 삭제 버튼, 마지막 슬롯이 비어있으면 + 추가 슬롯 */
function PhotoGridEdit({
  photos,
  onAdd,
  onRemove,
  alt,
  /** 한 줄에 표시할 최대 슬롯 수 (3 그리드) */
  maxPerRow = 3,
}: {
  photos: string[];
  onAdd: (files: FileList) => void;
  onRemove: (index: number) => void;
  alt: string;
  maxPerRow?: number;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleAddClick = () => inputRef.current?.click();
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAdd(e.target.files);
      /* 같은 파일을 다시 선택해도 onChange 발생하도록 reset */
      e.target.value = "";
    }
  };

  return (
    <div>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${maxPerRow}, minmax(0, 1fr))` }}
      >
        {photos.map((src, i) => (
          <div
            key={i}
            className="relative aspect-square rounded-lg overflow-hidden bg-gray-200 group"
          >
            <img
              src={src}
              alt={`${alt} ${i + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <button
              type="button"
              onClick={() => onRemove(i)}
              aria-label={`${alt} ${i + 1} 삭제`}
              className={[
                "absolute top-1 right-1 w-6 h-6 rounded-full",
                "bg-gray-900/70 text-white",
                "inline-flex items-center justify-center",
                "border-none cursor-pointer",
                "opacity-0 group-hover:opacity-100 focus:opacity-100",
                "transition-opacity",
              ].join(" ")}
            >
              <svg
                width="10"
                height="10"
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
          </div>
        ))}

        {/* 추가 슬롯 (사진이 없거나 더 추가하고 싶을 때) */}
        <button
          type="button"
          onClick={handleAddClick}
          aria-label={`${alt} 사진 추가`}
          className={[
            "aspect-square rounded-lg",
            "border border-dashed border-gray-300 bg-white",
            "text-gray-500 hover:text-gray-900 hover:border-gray-700 hover:bg-gray-100",
            "transition-colors cursor-pointer",
            "inline-flex items-center justify-center",
          ].join(" ")}
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

/**
 * 워크스페이스 페이지의 여행 기록 N일차 카드 (블로그/노션 스타일 일기장)
 *
 * 두 가지 모드:
 *
 * 1) 보기 모드 (기본)
 *    - 헤더: 📍 N일차 + "더보기" 버튼
 *    - 한 줄 여행 / 날씨 아이콘 4개
 *    - 본문 + 본문 사진 + 마무리 한 줄
 *    - 앨범 + 사진 추가 버튼
 *
 * 2) 편집 모드 ("더보기" 클릭 시 진입)
 *    - 헤더: 📍 N일차 + 취소 / 저장 버튼
 *    - 한 줄 여행: 한 줄 input + 날씨 4개 토글
 *    - 본문: textarea + 본문 사진 업로드/삭제 + 마무리 한 줄 input
 *    - 앨범: 앨범 사진 업로드/삭제
 *    - 저장 시 onSave(data) 호출 → 부모 state 갱신 (API 연결 시 PATCH)
 *    - 취소 시 진입 시점 데이터로 되돌림
 *
 * 디자인 스펙
 * - 카드 외곽: 396px 폭, 회색 보더, rounded-xl
 * - 좌우 패딩: 16px / 섹션 수직 패딩: 24px / 라벨↔본문 간격: 16px
 */
export default function TravelLogCard({
  dayNumber,
  oneLineSummary,
  weather,
  body,
  bodyPhotos,
  bodyClosing,
  albumPhotos,
  onSave,
  className = "",
}: TravelLogCardProps) {
  /** 편집 모드 여부 */
  const [isEditing, setIsEditing] = useState(false);

  /** 편집 중 임시 데이터 — 저장 시 onSave로 위임, 취소 시 폐기.
   *  보기 모드일 때는 이 state를 사용하지 않고 props를 직접 렌더하므로,
   *  부모 props 변경을 useEffect로 동기화할 필요 없음.
   *  (편집 모드 진입 시점에 enterEditMode에서 한 번만 초기화하면 충분) */
  const [draft, setDraft] = useState<TravelLogData>({
    oneLineSummary,
    weather,
    body,
    bodyPhotos: bodyPhotos ?? [],
    bodyClosing,
    albumPhotos: albumPhotos ?? [],
  });

  /** 편집 중 새로 추가한 사진의 ObjectURL을 추적
   *  → 컴포넌트 언마운트/취소 시 revoke해서 메모리 누수 방지
   *  (서버 URL은 추적할 필요 없음 — string[]으로만 들어옴) */
  const objectUrlsRef = useRef<string[]>([]);

  /** 컴포넌트 언마운트 시 만들어진 ObjectURL 정리 */
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    };
  }, []);

  /** File[] → ObjectURL[] (미리보기용)
   *  API 연결 시: 여기서 FormData 업로드 → 서버 URL 반환받아 사용하도록 교체
   *  현재는 클라이언트에서만 미리보기 */
  const filesToUrls = (files: FileList): string[] => {
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const url = URL.createObjectURL(files[i]);
      urls.push(url);
      objectUrlsRef.current.push(url);
    }
    return urls;
  };

  /* ── 모드 전환 ── */
  const enterEditMode = () => {
    setDraft({
      oneLineSummary,
      weather,
      body,
      bodyPhotos: bodyPhotos ?? [],
      bodyClosing,
      albumPhotos: albumPhotos ?? [],
    });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    /* 취소 시 새로 만든 ObjectURL은 즉시 revoke */
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current = [];
    setIsEditing(false);
  };

  const saveEdit = () => {
    /* trim 처리해서 빈 문자열은 undefined로 */
    const cleaned: TravelLogData = {
      oneLineSummary: draft.oneLineSummary?.trim() || undefined,
      weather: draft.weather,
      body: draft.body?.trim() || undefined,
      bodyClosing: draft.bodyClosing?.trim() || undefined,
      bodyPhotos: draft.bodyPhotos ?? [],
      albumPhotos: draft.albumPhotos ?? [],
    };
    onSave?.(cleaned);
    /* 저장된 ObjectURL은 부모 state로 넘어갔기 때문에 여기서 revoke하지 않음.
       부모가 데이터를 폐기할 때 자체적으로 정리해야 하지만,
       UI까지만 구현이므로 메모리 누수는 무시 — API 연결 후 실제 URL로 교체 시 자연 해소 */
    objectUrlsRef.current = [];
    setIsEditing(false);
  };

  return (
    <article
      className={[
        "bg-white rounded-xl border border-gray-300 overflow-hidden",
        "flex flex-col",
        // 카드 폭 396px 고정. max-w가 아닌 w로 둬야 편집 모드(input 위주)에서
        // 자식 min-content가 작아져 카드가 쪼그라드는 현상을 막을 수 있음.
        "w-[396px] min-w-0",
        "transition-shadow duration-200",
        isEditing ? "shadow-md" : "",
        className,
      ].join(" ")}
    >
      {/* ── 1. 헤더 ── */}
      <header className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <PinIcon className="w-6 h-6 shrink-0" />
          <span className="font-pretendard text-body2 font-semibold text-gray-900 truncate">
            {dayNumber}일차
          </span>
        </div>

        {isEditing ? (
          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={cancelEdit}
              className={[
                "px-3 py-1.5 rounded-md",
                "border border-gray-300 bg-white",
                "font-pretendard text-body4 text-gray-700",
                "hover:border-gray-700 transition-colors cursor-pointer",
              ].join(" ")}
            >
              취소
            </button>
            <button
              type="button"
              onClick={saveEdit}
              className={[
                "px-3 py-1.5 rounded-md",
                "border border-transparent bg-primary",
                "font-pretendard text-body4 font-medium text-gray-900",
                "hover:bg-primary-hover transition-colors cursor-pointer",
              ].join(" ")}
            >
              저장
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={enterEditMode}
            className={[
              "shrink-0 px-3 py-1.5 rounded-md",
              "border border-gray-300 bg-white",
              "font-pretendard text-body4 text-gray-700",
              "hover:border-gray-700 transition-colors cursor-pointer",
            ].join(" ")}
          >
            더보기
          </button>
        )}
      </header>

      <DashedDivider />

      {/* ── 2. 한 줄 여행 ── */}
      <div className="px-4 py-6 flex flex-col gap-4 min-w-0">
        <SectionLabel
          label="한줄 여행"
          rightSlot={
            isEditing ? (
              <WeatherIconGroupEdit
                weather={draft.weather}
                onChange={(w) => setDraft((d) => ({ ...d, weather: w }))}
              />
            ) : (
              <WeatherIconGroupView weather={weather} />
            )
          }
        />
        {isEditing ? (
          <EditTextInput
            value={draft.oneLineSummary ?? ""}
            onChange={(v) => setDraft((d) => ({ ...d, oneLineSummary: v }))}
            placeholder="오늘의 한 줄을 적어보세요."
            ariaLabel="한 줄 여행"
          />
        ) : (
          oneLineSummary && (
            <p className="font-pretendard text-body2 font-semibold text-gray-900 m-0 leading-snug truncate">
              {oneLineSummary}
            </p>
          )
        )}
      </div>

      <DashedDivider />

      {/* ── 3. 본문 + 사진 + 마무리 ── */}
      <div className="px-4 py-6 flex flex-col gap-6 min-w-0">
        {isEditing ? (
          <>
            <div className="flex flex-col gap-2">
              <span className="font-pretendard text-body4 font-medium text-gray-500">
                본문
              </span>
              <EditTextarea
                value={draft.body ?? ""}
                onChange={(v) => setDraft((d) => ({ ...d, body: v }))}
                placeholder="오늘 있었던 일을 자유롭게 적어보세요."
                ariaLabel="본문"
                rows={5}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-pretendard text-body4 font-medium text-gray-500">
                본문 사진 (최대 3장)
              </span>
              <PhotoGridEdit
                photos={(draft.bodyPhotos ?? []).slice(0, 3)}
                onAdd={(files) => {
                  const urls = filesToUrls(files);
                  setDraft((d) => ({
                    ...d,
                    /* 본문 사진은 3장 제한 */
                    bodyPhotos: [...(d.bodyPhotos ?? []), ...urls].slice(0, 3),
                  }));
                }}
                onRemove={(idx) => {
                  setDraft((d) => ({
                    ...d,
                    bodyPhotos: (d.bodyPhotos ?? []).filter(
                      (_, i) => i !== idx,
                    ),
                  }));
                }}
                alt={`${dayNumber}일차 본문`}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-pretendard text-body4 font-medium text-gray-500">
                마무리 한 줄
              </span>
              <EditTextInput
                value={draft.bodyClosing ?? ""}
                onChange={(v) => setDraft((d) => ({ ...d, bodyClosing: v }))}
                placeholder="하루를 마무리하는 한 줄을 적어보세요."
                ariaLabel="마무리 한 줄"
              />
            </div>
          </>
        ) : (
          <>
            {body && (
              <p
                className={[
                  "font-pretendard text-body3 text-gray-700 leading-relaxed m-0 whitespace-pre-line",
                  "line-clamp-3 break-keep",
                ].join(" ")}
              >
                {body}
              </p>
            )}

            {bodyPhotos && bodyPhotos.length > 0 && (
              <PhotoGridView
                photos={bodyPhotos}
                alt={`${dayNumber}일차 본문`}
              />
            )}

            {bodyClosing && (
              <p
                className={[
                  "font-pretendard text-body3 text-gray-700 leading-relaxed m-0",
                  "line-clamp-2 break-keep",
                ].join(" ")}
              >
                {bodyClosing}
              </p>
            )}
          </>
        )}
      </div>

      <DashedDivider />

      {/* ── 4. 앨범 ── */}
      <div className="px-4 py-6 flex flex-col gap-4 min-w-0">
        <SectionLabel label="앨범" />

        {isEditing ? (
          <PhotoGridEdit
            photos={draft.albumPhotos ?? []}
            onAdd={(files) => {
              const urls = filesToUrls(files);
              setDraft((d) => ({
                ...d,
                albumPhotos: [...(d.albumPhotos ?? []), ...urls],
              }));
            }}
            onRemove={(idx) => {
              setDraft((d) => ({
                ...d,
                albumPhotos: (d.albumPhotos ?? []).filter((_, i) => i !== idx),
              }));
            }}
            alt={`${dayNumber}일차 앨범`}
          />
        ) : albumPhotos && albumPhotos.length > 0 ? (
          <PhotoGridView photos={albumPhotos} alt={`${dayNumber}일차 앨범`} />
        ) : (
          <div
            className={[
              "h-24 rounded-lg border border-dashed border-gray-300",
              "flex items-center justify-center",
              "font-pretendard text-body4 text-gray-500",
            ].join(" ")}
          >
            등록된 사진이 없습니다.
          </div>
        )}
      </div>
    </article>
  );
}
