import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import type { JSONContent } from "@tiptap/core";
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

/**
 * 편집 모드에서 부모로 전달되는 데이터 묶음
 *
 * - 보기 모드 props와 동일 형태이므로, 부모는 그대로 받아서 state에 머지하면 됨
 * - content는 Tiptap JSON (JSONContent). 백엔드 합의: Tiptap JSON 그대로 저장.
 *   string으로 직렬화하고 싶으면 JSON.stringify(content)로 변환.
 * - albumPhotos는 string[] (URL 또는 createObjectURL 결과). API 연결 시
 *   File 업로드 → 서버 URL 받기 → setState로 갱신하는 흐름으로 바꾸면 됨
 */
export interface TravelLogData {
  oneLineSummary?: string;
  weather?: WeatherType;
  /**
   * 본문 (텍스트 + 이미지 + 인라인 서식이 섞인 Tiptap JSON 문서).
   * 빈 본문은 undefined로 둠.
   */
  content?: JSONContent;
  albumPhotos?: string[];
}

interface TravelLogCardProps {
  /** 일차 번호 */
  dayNumber: number;
  /** 한 줄 여행 텍스트 "프랑크푸르트 여행 1일차, 날씨가 다웠다." */
  oneLineSummary?: string;
  /** 한 줄 여행 우측 날씨 (선택된 1개) */
  weather?: WeatherType;
  /** 본문 (Tiptap JSON 문서) — 텍스트와 이미지가 자유롭게 섞임 */
  content?: JSONContent;
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

/** 보기 모드 사진 그리드 (3장 가로 배치, 빈 슬롯은 출력 안함) — 앨범에서 사용 */
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

/** 한 줄 입력 (한 줄 여행) */
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

/** 사진 그리드 (편집 모드) — 앨범에서만 사용 */
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
   Tiptap 본문 에디터
   ══════════════════════════════════════════ */

/**
 * 본문에 들어갈 빈 Tiptap 문서.
 * Tiptap은 빈 paragraph 하나가 있어야 커서가 잡힘.
 */
const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

/**
 * Tiptap 문서가 사실상 비어있는지 판정.
 * - 텍스트도 없고
 * - 이미지 같은 미디어 노드도 없음
 *
 * → 비어있으면 onSave 시 content를 undefined로 정리하기 위함
 */
function isContentEmpty(json: JSONContent | undefined): boolean {
  if (!json) return true;
  // 어떤 leaf에라도 text 또는 image 노드가 있으면 not empty
  let hasContent = false;
  const walk = (node: JSONContent) => {
    if (hasContent) return;
    if (node.type === "image") {
      hasContent = true;
      return;
    }
    if (
      node.type === "text" &&
      typeof node.text === "string" &&
      node.text.length > 0
    ) {
      hasContent = true;
      return;
    }
    if (Array.isArray(node.content)) {
      for (const child of node.content) walk(child);
    }
  };
  walk(json);
  return !hasContent;
}

/**
 * 에디터 위쪽 작은 툴바.
 * - 굵게 / 기울임 / 이미지 삽입
 *
 * 이미지 삽입은 file input → ObjectURL → setImage(src)로 커서 위치에 삽입.
 * API 연결 시: file을 서버에 업로드한 뒤 받은 URL로 src를 교체하면 됨.
 */
function EditorToolbar({
  editor,
  onPickImage,
}: {
  editor: Editor;
  onPickImage: () => void;
}) {
  const btnBase = [
    "px-2 py-1 rounded-md",
    "border border-gray-300 bg-white",
    "font-pretendard text-body4 text-gray-700",
    "hover:border-gray-700 hover:bg-gray-100 transition-colors cursor-pointer",
  ].join(" ");
  const btnActive = "bg-gray-200 border-gray-700";

  return (
    <div
      className="flex items-center gap-1 px-1 py-1 border-b border-gray-200 bg-gray-100 rounded-t-md"
      role="toolbar"
      aria-label="본문 서식"
    >
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        aria-label="굵게"
        aria-pressed={editor.isActive("bold")}
        className={[btnBase, editor.isActive("bold") ? btnActive : ""].join(
          " ",
        )}
      >
        <span className="font-bold">B</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        aria-label="기울임"
        aria-pressed={editor.isActive("italic")}
        className={[btnBase, editor.isActive("italic") ? btnActive : ""].join(
          " ",
        )}
      >
        <span className="italic">I</span>
      </button>
      <div className="w-px h-5 bg-gray-300 mx-1" aria-hidden />
      <button
        type="button"
        onClick={onPickImage}
        aria-label="이미지 삽입"
        className={btnBase}
      >
        <span className="inline-flex items-center gap-1">
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
          >
            <rect
              x="1.5"
              y="2.5"
              width="13"
              height="11"
              rx="1.5"
              stroke="currentColor"
            />
            <circle cx="5.5" cy="6.5" r="1" fill="currentColor" />
            <path
              d="M2 11L6 7L9 10L11 8L14 11"
              stroke="currentColor"
              strokeWidth="1.2"
              fill="none"
            />
          </svg>
          사진
        </span>
      </button>
    </div>
  );
}

/**
 * 보기 모드용 (읽기 전용) Tiptap 렌더러.
 * 같은 extension 셋으로 editable=false 에디터를 만들어 본문을 그대로 그려줌.
 * → 보기/편집 간 렌더 일관성 보장.
 *
 * key prop을 활용해 content가 바뀌면 다시 만들도록 함 (Tiptap은 외부 content 변경에
 * 자동 동기화되지 않음 — 보기 전용에선 매번 새로 만드는 게 가장 단순함).
 */
function BodyView({ content }: { content?: JSONContent }) {
  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: content ?? EMPTY_DOC,
    editable: false,
  });

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  if (!editor) return null;
  if (isContentEmpty(content)) return null;

  return (
    <EditorContent
      editor={editor}
      className={[
        // 본문 prose 스타일 — Tailwind typography를 안 쓰므로 직접 지정
        "font-pretendard text-body3 text-gray-700 leading-relaxed",
        // ProseMirror 기본 outline 제거 (보기 모드라 어차피 포커스 안 됨)
        "[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-0",
        // 이미지 스타일
        "[&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-2",
        // 문단 간격
        "[&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
        // break-keep으로 한글 줄바꿈 자연스럽게
        "break-keep",
      ].join(" ")}
    />
  );
}

/**
 * 편집 모드용 Tiptap 에디터.
 * - StarterKit (텍스트 기본 + 굵게/기울임/리스트 등)
 * - Image (인라인 이미지)
 * - Placeholder (빈 에디터에 안내 문구)
 *
 * onUpdate에서 외부 onChange로 JSON 전달 → 부모 draft state 갱신.
 *
 * 부모가 편집 진입 시점에 한 번 initialContent를 주면 그걸로 시작.
 * Tiptap 자체는 controlled 컴포넌트가 아니므로 props.content를 매번 set하지 않음
 * (그렇게 하면 IME 한글 입력이 깨짐).
 */
function BodyEditor({
  initialContent,
  onChange,
  registerObjectUrl,
}: {
  initialContent?: JSONContent;
  onChange: (json: JSONContent) => void;
  /** 새로 만든 ObjectURL을 부모에 등록 → 언마운트/취소 시 revoke 위함 */
  registerObjectUrl: (url: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        // 인라인이 아니라 블록 이미지로 (한 줄을 차지). 노션과 동일한 동작.
        inline: false,
        allowBase64: false,
      }),
      Placeholder.configure({
        placeholder:
          "오늘 있었던 일을 자유롭게 적어보세요. 사진은 위 버튼으로 추가할 수 있어요.",
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: initialContent ?? EMPTY_DOC,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        // 에디터 영역 자체에 패딩 / 최소 높이
        class: [
          "min-h-[140px] px-3 py-2 outline-none",
          "font-pretendard text-body3 text-gray-700 leading-relaxed",
          "break-keep",
        ].join(" "),
      },
    },
  });

  // 컴포넌트 언마운트 시 에디터 정리
  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  const handlePickImage = () => fileInputRef.current?.click();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editor) return;
    // 여러 장 선택 시 순서대로 삽입
    for (let i = 0; i < files.length; i++) {
      const url = URL.createObjectURL(files[i]);
      registerObjectUrl(url);
      editor.chain().focus().setImage({ src: url }).run();
    }
    e.target.value = "";
  };

  if (!editor) {
    // 에디터 초기화 전 (한 프레임)에 자리만 차지
    return (
      <div className="border border-gray-300 rounded-md min-h-[140px] bg-white" />
    );
  }

  return (
    <div className="border border-gray-300 rounded-md bg-white overflow-hidden focus-within:border-gray-700 transition-colors">
      <EditorToolbar editor={editor} onPickImage={handlePickImage} />
      <EditorContent
        editor={editor}
        className={[
          // 이미지 / 문단 스타일 (보기 모드와 동일하게)
          "[&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-2",
          "[&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
          // Placeholder 스타일 — Tiptap Placeholder extension의 관용
          "[&_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
          "[&_.is-editor-empty:first-child]:before:text-gray-500",
          "[&_.is-editor-empty:first-child]:before:float-left",
          "[&_.is-editor-empty:first-child]:before:h-0",
          "[&_.is-editor-empty:first-child]:before:pointer-events-none",
        ].join(" ")}
      />
      <input
        ref={fileInputRef}
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
 *    - 본문 (Tiptap 읽기 전용 렌더 — 텍스트 + 이미지가 자유롭게 섞임)
 *    - 앨범 + 사진 추가 버튼
 *
 * 2) 편집 모드 ("더보기" 클릭 시 진입)
 *    - 헤더: 📍 N일차 + 취소 / 저장 버튼
 *    - 한 줄 여행: 한 줄 input + 날씨 4개 토글
 *    - 본문: Tiptap 에디터 (굵게/기울임/이미지 삽입 툴바)
 *    - 앨범: 앨범 사진 업로드/삭제
 *    - 저장 시 onSave(data) 호출 → 부모 state 갱신 (API 연결 시 PATCH)
 *    - 취소 시 진입 시점 데이터로 되돌림
 *
 * 데이터 모델
 * - 본문은 Tiptap JSON (JSONContent). 백엔드 합의: Tiptap JSON 그대로 저장.
 * - 본문 안의 이미지 src는 현재 ObjectURL이지만, API 연결 시 업로드 후 서버 URL로 교체.
 *
 * 디자인 스펙
 * - 카드 외곽: 396px 폭, 회색 보더, rounded-xl
 * - 좌우 패딩: 16px / 섹션 수직 패딩: 24px / 라벨↔본문 간격: 16px
 */
export default function TravelLogCard({
  dayNumber,
  oneLineSummary,
  weather,
  content,
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
    content,
    albumPhotos: albumPhotos ?? [],
  });

  /** 편집 중 새로 추가한 사진의 ObjectURL을 추적
   *  → 컴포넌트 언마운트/취소 시 revoke해서 메모리 누수 방지
   *  (본문 이미지 + 앨범 이미지 모두 여기로 모음) */
  const objectUrlsRef = useRef<string[]>([]);

  const registerObjectUrl = (url: string) => {
    objectUrlsRef.current.push(url);
  };

  /** 컴포넌트 언마운트 시 만들어진 ObjectURL 정리 */
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    };
  }, []);

  /** File[] → ObjectURL[] (앨범 미리보기용)
   *  API 연결 시: 여기서 FormData 업로드 → 서버 URL 반환받아 사용하도록 교체 */
  const filesToUrls = (files: FileList): string[] => {
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const url = URL.createObjectURL(files[i]);
      urls.push(url);
      registerObjectUrl(url);
    }
    return urls;
  };

  /* ── 모드 전환 ── */
  const enterEditMode = () => {
    setDraft({
      oneLineSummary,
      weather,
      content,
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
    /* trim 처리해서 빈 문자열은 undefined로,
       빈 본문 JSON은 undefined로 정리 */
    const cleaned: TravelLogData = {
      oneLineSummary: draft.oneLineSummary?.trim() || undefined,
      weather: draft.weather,
      content: isContentEmpty(draft.content) ? undefined : draft.content,
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

      {/* ── 3. 본문 (Tiptap) ── */}
      <div className="px-4 py-6 flex flex-col gap-2 min-w-0">
        {isEditing ? (
          <>
            <span className="font-pretendard text-body4 font-medium text-gray-500">
              본문
            </span>
            <BodyEditor
              initialContent={draft.content}
              onChange={(json) => setDraft((d) => ({ ...d, content: json }))}
              registerObjectUrl={registerObjectUrl}
            />
          </>
        ) : (
          <BodyView content={content} />
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
