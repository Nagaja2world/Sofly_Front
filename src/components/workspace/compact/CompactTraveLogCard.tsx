import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import type { JSONContent } from "@tiptap/core";
import PlusIcon from "@/assets/plus.svg?react";
import Edit2Icon from "@/assets/edit2.svg?react";
import ConfirmPopup from "@/components/common/ConfirmPopup";
import SharedAlbumPickerPopup from "@/components/workspace/SharedAlbumPickerPopup";
import SunPressedIcon from "@/assets/sun_pressed.svg?react";
import SunIcon from "@/assets/sun.svg?react";
import CloudPressedIcon from "@/assets/cloud_pressed.svg?react";
import CloudIcon from "@/assets/cloud.svg?react";
import CloudRainingPressedIcon from "@/assets/cloud-raining_pressed.svg?react";
import CloudRainingIcon from "@/assets/cloud-raining.svg?react";
import SnowPressedIcon from "@/assets/snow_pressed.svg?react";
import SnowIcon from "@/assets/snow.svg?react";
import type {
  CompactWeatherType,
  CompactTravelLogData,
} from "./CompactTravelLogSection";

/* ══════════════════════════════════════════
   CompactTravelLogCard
   ══════════════════════════════════════════
   좁은 화면(< 768px)용 여행 기록 카드 한 장. (이미지 1·3 기준)

   구조 (위 → 아래):
   ┌────────────────────────────┐
   │ ⠿ 프랑크푸르트 여행  [편집][×]│  ← 헤더: 드래그핸들 + 제목 + 편집/삭제
   ├────────────────────────────┤
   │ 한줄 여행          ☀ ☁ 🌧 ❄ │  ← 한 줄 여행 (라벨 + 날씨 4개)
   │ 프랑크푸르트 여행 1일차…       │     선택된 날씨만 채워진 아이콘
   ├──────── 실선 ───────────────┤
   │ 프랑크푸르트 공항에 도착해…    │  ┐ 본문
   │ [사진][사진][사진][사진]      │  │ (텍스트 + 이미지가 섞인 Tiptap)
   │ 이후 호텔에 체크인하며…        │  ┘
   ┊┄┄┄┄┄┄ 점선 ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┊
   │ 앨범                         │  ← 앨범 (라벨)
   │ [사진][사진][사진][사진]      │     사진 그리드
   └────────────────────────────┘

   제목(mainTitle):
   - 카드는 "N일차"가 아니라 사용자가 정한 제목(mainTitle)으로 구분됨.
   - 데스크톱 TravelLogCard처럼 헤더에서 제목을 인라인 편집.
     · 헤더 제목을 탭하면 input으로 바뀌고, blur/Enter 시 onSaveMainTitle 호출.
     · onSaveMainTitle 미지정 시 제목은 읽기 전용 텍스트.
   - mainTitle이 null/빈 값이면 "제목 없는 기록" 플레이스홀더 표시.

   두 가지 모드 (본문/날씨/한줄요약):

   1) 보기 모드 (기본)
      - 본문: Tiptap 읽기 전용 렌더.
      - 앨범: 사진 그리드 (없으면 placeholder).

   2) 편집 모드 (onSave가 있을 때만 진입 가능)
      - 한 줄 여행: 텍스트 input + 날씨 라디오.
      - 본문: Tiptap 에디터 (데스크톱 TravelLogCard와 동일).
        · 굵게 / 기울임 서식.
        · "사진" 드롭다운 → 내 기기에서 찾기 / 공유앨범에서 찾기.
          공유앨범 경로는 sharedAlbumPhotos prop + SharedAlbumPickerPopup 사용.
        · 사진은 본문 안에 인라인 블록 이미지로 삽입됨.
        이전에는 plain textarea였으나, 본문 사진 첨부 요구로 데스크톱과
        동일한 에디터로 교체함. 좁은 폭(288px)에서도 툴바 버튼은
        아이콘 위주로 줄여 한 줄에 들어가도록 함.
      - 앨범: 사진 추가/삭제 (본문과 별개의 사진 그리드).
      - "저장" 시 onSave(CompactTravelLogData).
      - 제목(mainTitle)은 편집 모드와 별개로 헤더에서 인라인 편집.

   드래그 재정렬:
   - dragHandleProps가 주어지면 헤더 왼쪽에 "⠿" 드래그 핸들이 나타남.
     이 핸들의 포인터 이벤트를 부모(CompactTravelLogSection)가 받아 재정렬.
   - 핸들에서만 드래그가 시작되므로 카드 본문 터치는 가로 스크롤 그대로.

   타입은 CompactTravelLogSection에서 가져옴 (데스크톱 UI 파일 의존 차단).
*/

/** 헤더 드래그 핸들에 그대로 펼쳐 넣을 포인터 이벤트 핸들러 묶음 */
export interface DragHandleProps {
  onPointerDown: (e: ReactPointerEvent) => void;
  onPointerMove: (e: ReactPointerEvent) => void;
  onPointerUp: (e: ReactPointerEvent) => void;
  onPointerCancel: (e: ReactPointerEvent) => void;
}

interface CompactTravelLogCardProps {
  /** 카드 제목 — null/빈 값이면 플레이스홀더 표시 */
  mainTitle: string | null;
  /** 한 줄 여행 텍스트 */
  oneLineSummary?: string;
  /** 날씨 (선택된 1개) */
  weather?: CompactWeatherType;
  /** 본문 (Tiptap JSON 문서) */
  content?: JSONContent;
  /** 앨범 사진 URL 목록 */
  albumPhotos?: string[];
  /**
   * 워크스페이스 공유 앨범 사진 URL 배열.
   * 편집 모드 본문 툴바의 "사진" → "공유앨범에서 찾기" 클릭 시 열리는
   * 선택 모달(SharedAlbumPickerPopup)에 전달됨.
   * 미지정 시 빈 배열로 취급 → 공유앨범 선택 모달이 빈 상태로 열림.
   */
  sharedAlbumPhotos?: string[];
  /**
   * 제목(mainTitle) 인라인 편집 저장.
   * 미지정 시 헤더 제목은 읽기 전용.
   */
  onSaveMainTitle?: (title: string) => void;
  /**
   * 본문/날씨/한줄요약 편집 저장. "저장" 시 호출.
   * 미지정 시 본문 편집 버튼이 숨겨짐.
   */
  onSave?: (data: CompactTravelLogData) => void;
  /**
   * 앨범 사진 즉시 업로드 콜백 — 데스크톱 TravelLogCard의 동명 prop과
   * 동일한 계약(시그니처)을 노출하기 위한 채널.
   *
   * 데스크톱 TravelLogCard도 이 prop을 타입에만 선언하고 구조분해/호출하지
   * 않는다(편집 모드 앨범은 File을 onSave의 albumPhotos로만 넘김). compact도
   * 양쪽 props 표면을 맞추기 위해 선언만 해 두며, 실제 호출은 하지 않는다.
   * 따라서 ESLint unused 경고를 피하려 구조분해 목록에도 넣지 않는다.
   */
  onUploadPhotos?: (files: File[]) => void;
  /**
   * 카드 삭제 콜백. 헤더 "×" → 확인 모달 → 호출.
   * 미지정 시 삭제 버튼이 숨겨짐.
   */
  onDelete?: () => void;
  /**
   * 드래그 핸들 포인터 이벤트 묶음.
   * 주어지면 헤더에 드래그 핸들이 표시되고, 부모가 재정렬을 처리.
   */
  dragHandleProps?: DragHandleProps;
  /** 추가 클래스 */
  className?: string;
}

/** mainTitle이 비었을 때 헤더에 표시할 플레이스홀더 */
const TITLE_PLACEHOLDER = "제목 없는 기록";

/* ──────────────────────────────────────────
   날씨 아이콘 (보기/편집 공용)
   ────────────────────────────────────────── */

const WEATHER_TYPES: CompactWeatherType[] = [
  "sunny",
  "cloudy",
  "rainy",
  "snowy",
];

const WEATHER_LABEL: Record<CompactWeatherType, string> = {
  sunny: "맑음",
  cloudy: "흐림",
  rainy: "비",
  snowy: "눈",
};

function WeatherIcon({
  type,
  active,
}: {
  type: CompactWeatherType;
  active: boolean;
}) {
  const cls = "w-5 h-5";
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

/** 보기 모드: 날씨 4개 (선택된 1개만 채워짐) */
function WeatherRowView({ weather }: { weather?: CompactWeatherType }) {
  return (
    <div className="flex items-center gap-1">
      {WEATHER_TYPES.map((t) => (
        <WeatherIcon key={t} type={t} active={t === weather} />
      ))}
    </div>
  );
}

/** 편집 모드: 날씨 4개를 라디오처럼 토글 */
function WeatherRowEdit({
  weather,
  onChange,
}: {
  weather?: CompactWeatherType;
  onChange: (w: CompactWeatherType | undefined) => void;
}) {
  return (
    <div
      className="flex items-center gap-0.5"
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
              "p-1 rounded-md border border-transparent bg-transparent",
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

/* ──────────────────────────────────────────
   본문 보기 (Tiptap 읽기 전용)
   ────────────────────────────────────────── */

const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

/** Tiptap 문서가 사실상 비어있는지 (텍스트/이미지 노드 유무) */
function isContentEmpty(json: JSONContent | undefined): boolean {
  if (!json) return true;
  let has = false;
  const walk = (node: JSONContent) => {
    if (has) return;
    if (node.type === "text" && node.text?.trim()) has = true;
    if (node.type === "image") has = true;
    (node.content ?? []).forEach(walk);
  };
  (json.content ?? []).forEach(walk);
  return !has;
}

function BodyView({ content }: { content?: JSONContent }) {
  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: content ?? EMPTY_DOC,
    editable: false,
  });

  const lastRef = useRef<JSONContent | undefined>(content);

  useEffect(() => {
    if (!editor) return;
    if (lastRef.current === content) return;
    editor.commands.setContent(content ?? EMPTY_DOC, { emitUpdate: false });
    lastRef.current = content;
  }, [editor, content]);

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  if (!editor) return null;
  if (isContentEmpty(content)) {
    return (
      <p className="font-pretendard text-body4 text-gray-400 m-0">
        작성된 본문이 없습니다.
      </p>
    );
  }

  return (
    <EditorContent
      editor={editor}
      className={[
        "font-pretendard text-body3 text-gray-700 leading-relaxed break-keep",
        "[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-0",
        "[&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-2",
        "[&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
      ].join(" ")}
    />
  );
}

/* ──────────────────────────────────────────
   본문 편집 (Tiptap 에디터 + 사진 툴바)
   ──────────────────────────────────────────
   데스크톱 TravelLogCard의 BodyEditor를 compact 폭(288px)에 맞춰 이식.
   - 굵게 / 기울임 / 사진 드롭다운(내 기기 · 공유앨범).
   - 사진은 본문 안에 인라인 블록 이미지로 삽입.
   - 좁은 폭이라 툴바 버튼은 작게(아이콘 + 짧은 라벨).
*/

/**
 * 본문 에디터 위쪽 작은 툴바.
 * "사진" 버튼은 드롭다운 트리거 — 내 기기 / 공유앨범 두 진입점.
 *
 * 드롭다운 메뉴는 createPortal로 body에 띄움 (에디터 wrapper의 overflow-hidden
 * 에 잘리지 않도록). 카드가 가로 스크롤 컨테이너 안에 있어 트리거 위치가
 * 스크롤/리사이즈로 바뀌므로 fixed 좌표를 capture 이벤트로 추적.
 */
function EditorToolbar({
  editor,
  onPickFromDevice,
  onPickFromSharedAlbum,
}: {
  editor: Editor;
  onPickFromDevice: () => void;
  onPickFromSharedAlbum: () => void;
}) {
  const btnBase = [
    "px-1.5 py-1 rounded-md",
    "border border-gray-300 bg-white",
    "font-pretendard text-body5 text-gray-700",
    "hover:border-gray-700 hover:bg-gray-100 transition-colors cursor-pointer",
  ].join(" ");
  const btnActive = "bg-gray-200 border-gray-700";

  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false);
  const photoTriggerRef = useRef<HTMLButtonElement>(null);
  const photoMenuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null,
  );

  const updateMenuPos = () => {
    const el = photoTriggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, left: rect.left });
  };

  /* 외부 클릭 / ESC로 닫기 + 트리거 위치 추적 (스크롤/리사이즈) */
  useEffect(() => {
    if (!isPhotoMenuOpen) return;
    updateMenuPos();

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (photoTriggerRef.current?.contains(target)) return;
      if (photoMenuRef.current?.contains(target)) return;
      setIsPhotoMenuOpen(false);
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsPhotoMenuOpen(false);
    };
    const handleReposition = () => updateMenuPos();

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [isPhotoMenuOpen]);

  const handlePickFromDevice = () => {
    setIsPhotoMenuOpen(false);
    onPickFromDevice();
  };
  const handlePickFromSharedAlbum = () => {
    setIsPhotoMenuOpen(false);
    onPickFromSharedAlbum();
  };

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
      <div className="w-px h-4 bg-gray-300 mx-0.5" aria-hidden />

      {/* 사진 드롭다운 */}
      <div>
        <button
          ref={photoTriggerRef}
          type="button"
          onClick={() => setIsPhotoMenuOpen((o) => !o)}
          aria-label="이미지 삽입"
          aria-haspopup="menu"
          aria-expanded={isPhotoMenuOpen}
          className={[btnBase, isPhotoMenuOpen ? btnActive : ""].join(" ")}
        >
          <span className="inline-flex items-center gap-1">
            <svg
              width="13"
              height="13"
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

        {isPhotoMenuOpen &&
          menuPos &&
          createPortal(
            <div
              ref={photoMenuRef}
              role="menu"
              aria-label="사진 가져오기"
              style={{
                position: "fixed",
                top: menuPos.top,
                left: menuPos.left,
              }}
              className={[
                "z-50 min-w-[160px]",
                "bg-white border border-gray-300 rounded-md shadow-lg",
                "py-1",
              ].join(" ")}
            >
              <PhotoMenuItem
                label="내 기기에서 찾기"
                onClick={handlePickFromDevice}
              />
              <PhotoMenuItem
                label="공유앨범에서 찾기"
                onClick={handlePickFromSharedAlbum}
              />
            </div>,
            document.body,
          )}
      </div>
    </div>
  );
}

/** 사진 드롭다운 메뉴 항목 한 줄 */
function PhotoMenuItem({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={[
        "w-full text-left px-3 py-2",
        "font-pretendard text-body4 text-gray-700",
        "hover:bg-gray-100 hover:text-gray-900",
        "transition-colors cursor-pointer",
        "border-none bg-transparent",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

/**
 * 편집 모드용 Tiptap 본문 에디터.
 * - StarterKit + Image(블록) + Placeholder.
 * - onUpdate에서 onChange로 JSON 전달 → 부모 draft 갱신.
 * - 이미지 삽입: 내 기기(파일 → ObjectURL) / 공유앨범(기존 URL).
 *
 * Tiptap은 controlled가 아니므로 props.content를 매번 set하지 않음
 * (그렇게 하면 한글 IME 입력이 깨짐). 편집 진입 시 initialContent로 1회 초기화.
 */
function BodyEditor({
  initialContent,
  onChange,
  registerObjectUrl,
  sharedAlbumPhotos,
}: {
  initialContent?: JSONContent;
  onChange: (json: JSONContent) => void;
  /** 새로 만든 ObjectURL을 부모에 등록 → 취소/언마운트 시 revoke */
  registerObjectUrl: (url: string) => void;
  /** 워크스페이스 공유 앨범 사진 URL 배열 (공유앨범 선택 모달용) */
  sharedAlbumPhotos: string[];
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSharedAlbumPickerOpen, setIsSharedAlbumPickerOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({
        placeholder:
          "오늘의 여행을 기록해보세요. 사진은 위 버튼으로 추가할 수 있어요.",
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: initialContent ?? EMPTY_DOC,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: [
          "min-h-[120px] px-3 py-2 outline-none",
          "font-pretendard text-body3 text-gray-700 leading-relaxed",
          "break-keep",
        ].join(" "),
      },
    },
  });

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  const handlePickImage = () => fileInputRef.current?.click();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editor) return;
    for (let i = 0; i < files.length; i++) {
      const url = URL.createObjectURL(files[i]);
      registerObjectUrl(url);
      editor.chain().focus().setImage({ src: url }).run();
    }
    e.target.value = "";
  };

  /** 공유앨범에서 고른 URL들을 순서대로 본문에 삽입.
   *  공유앨범의 기존 URL을 그대로 쓰므로 새 ObjectURL을 만들지 않음. */
  const handleInsertFromSharedAlbum = (urls: string[]) => {
    if (!editor) return;
    for (const url of urls) {
      editor.chain().focus().setImage({ src: url }).run();
    }
    setIsSharedAlbumPickerOpen(false);
  };

  if (!editor) {
    return (
      <div className="border border-gray-300 rounded-md min-h-[120px] bg-white" />
    );
  }

  return (
    <div className="flex flex-col border border-gray-300 rounded-md bg-white overflow-hidden focus-within:border-gray-700 transition-colors">
      <div className="shrink-0">
        <EditorToolbar
          editor={editor}
          onPickFromDevice={handlePickImage}
          onPickFromSharedAlbum={() => setIsSharedAlbumPickerOpen(true)}
        />
      </div>
      <div
        className={[
          "max-h-[260px] overflow-y-auto",
          "[&::-webkit-scrollbar]:w-1.5",
          "[&::-webkit-scrollbar-thumb]:bg-gray-300",
          "[&::-webkit-scrollbar-thumb]:rounded",
          "[&::-webkit-scrollbar-track]:bg-transparent",
        ].join(" ")}
      >
        <EditorContent
          editor={editor}
          className={[
            "[&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-2",
            "[&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
            "[&_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
            "[&_.is-editor-empty:first-child]:before:text-gray-400",
            "[&_.is-editor-empty:first-child]:before:float-left",
            "[&_.is-editor-empty:first-child]:before:h-0",
            "[&_.is-editor-empty:first-child]:before:pointer-events-none",
          ].join(" ")}
        />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      <SharedAlbumPickerPopup
        isOpen={isSharedAlbumPickerOpen}
        photos={sharedAlbumPhotos}
        onClose={() => setIsSharedAlbumPickerOpen(false)}
        onSelect={handleInsertFromSharedAlbum}
      />
    </div>
  );
}

/* ──────────────────────────────────────────
   사진 그리드 (이미지 1·3 기준: 한 줄 4장)
   ────────────────────────────────────────── */

function PhotoGridView({ photos, alt }: { photos: string[]; alt: string }) {
  if (!photos || photos.length === 0) return null;
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {photos.map((src, i) => (
        <div
          key={i}
          className="relative aspect-square rounded-md overflow-hidden bg-gray-200"
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

function PhotoGridEdit({
  photos,
  onAdd,
  onRemove,
  alt,
}: {
  photos: string[];
  onAdd: (files: FileList) => void;
  onRemove: (index: number) => void;
  alt: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div>
      <div className="grid grid-cols-4 gap-1.5">
        {photos.map((src, i) => (
          <div
            key={i}
            className="relative aspect-square rounded-md overflow-hidden bg-gray-200"
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
          </div>
        ))}

        {/* 추가 슬롯 */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label={`${alt} 사진 추가`}
          className={[
            "aspect-square rounded-md",
            "border border-dashed border-gray-300 bg-white",
            "text-gray-400 hover:text-gray-700 hover:border-gray-700 hover:bg-gray-50",
            "transition-colors cursor-pointer",
            "inline-flex items-center justify-center",
          ].join(" ")}
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onAdd(e.target.files);
            e.target.value = "";
          }
        }}
        className="hidden"
      />
    </div>
  );
}

/* ──────────────────────────────────────────
   섹션 라벨
   ────────────────────────────────────────── */

function SectionLabel({
  label,
  rightSlot,
}: {
  label: string;
  rightSlot?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 min-h-7">
      <span className="font-pretendard text-body4 font-medium text-gray-500">
        {label}
      </span>
      {rightSlot}
    </div>
  );
}

/** 드래그 핸들 아이콘 (점 6개) */
function GripIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      <circle cx="5.5" cy="3.5" r="1.4" />
      <circle cx="10.5" cy="3.5" r="1.4" />
      <circle cx="5.5" cy="8" r="1.4" />
      <circle cx="10.5" cy="8" r="1.4" />
      <circle cx="5.5" cy="12.5" r="1.4" />
      <circle cx="10.5" cy="12.5" r="1.4" />
    </svg>
  );
}

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

export default function CompactTravelLogCard({
  mainTitle,
  oneLineSummary,
  weather,
  content,
  albumPhotos,
  sharedAlbumPhotos,
  onSaveMainTitle,
  onSave,
  onDelete,
  dragHandleProps,
  className = "",
}: CompactTravelLogCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /* 헤더 제목 인라인 편집 */
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(mainTitle ?? "");

  /* 본문 편집 임시 데이터 */
  const [draftSummary, setDraftSummary] = useState(oneLineSummary ?? "");
  const [draftWeather, setDraftWeather] = useState<
    CompactWeatherType | undefined
  >(weather);
  /* 본문 — Tiptap JSON. 편집 진입 시점에 현재 content로 초기화. */
  const [draftContent, setDraftContent] = useState<JSONContent | undefined>(
    content,
  );
  const [draftPhotos, setDraftPhotos] = useState<string[]>(albumPhotos ?? []);

  /* 편집 중 새로 만든 ObjectURL 추적 (메모리 누수 방지) */
  const objectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      objectUrlsRef.current = [];
    };
  }, []);

  /* ── 헤더 제목 인라인 편집 ── */
  const startTitleEdit = () => {
    if (!onSaveMainTitle) return;
    setTitleDraft(mainTitle ?? "");
    setIsTitleEditing(true);
  };

  const commitTitleEdit = () => {
    const trimmed = titleDraft.trim();
    /* 값이 실제로 바뀐 경우에만 저장 호출 */
    if (trimmed !== (mainTitle ?? "")) {
      onSaveMainTitle?.(trimmed);
    }
    setIsTitleEditing(false);
  };

  const cancelTitleEdit = () => {
    setTitleDraft(mainTitle ?? "");
    setIsTitleEditing(false);
  };

  /* ── 본문 편집 모드 전환 ── */
  const enterEditMode = () => {
    setDraftSummary(oneLineSummary ?? "");
    setDraftWeather(weather);
    setDraftContent(content);
    setDraftPhotos(albumPhotos ?? []);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    objectUrlsRef.current = [];
    setIsEditing(false);
  };

  const saveEdit = () => {
    const data: CompactTravelLogData = {
      oneLineSummary: draftSummary.trim() || undefined,
      weather: draftWeather,
      /* 빈 본문 JSON은 undefined로 정리 (데스크톱 TravelLogCard와 동일) */
      content: isContentEmpty(draftContent) ? undefined : draftContent,
      albumPhotos: draftPhotos,
    };
    onSave?.(data);
    /* 저장된 URL은 부모 state로 넘어가므로 여기서 revoke하지 않음 */
    objectUrlsRef.current = [];
    setIsEditing(false);
  };

  /** 본문 에디터가 새로 만든 ObjectURL을 추적 목록에 등록 */
  const registerObjectUrl = (url: string) => {
    objectUrlsRef.current.push(url);
  };

  /* ── 앨범 사진 추가/삭제 ── */
  const addPhotos = (files: FileList) => {
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const url = URL.createObjectURL(files[i]);
      objectUrlsRef.current.push(url);
      urls.push(url);
    }
    setDraftPhotos((prev) => [...prev, ...urls]);
  };

  const removePhoto = (idx: number) => {
    setDraftPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  /* 헤더에 표시할 제목 — 비었으면 플레이스홀더 */
  const displayTitle = mainTitle?.trim() || TITLE_PLACEHOLDER;
  const isTitlePlaceholder = !mainTitle?.trim();

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
      <header className="shrink-0 flex items-center gap-1.5 px-3 py-3">
        {/* 드래그 핸들 — dragHandleProps가 있을 때만.
            touch-none으로 핸들 위 터치가 스크롤로 새지 않게 함. */}
        {dragHandleProps && !isEditing && (
          <button
            type="button"
            aria-label="카드 순서 변경 손잡이"
            onPointerDown={dragHandleProps.onPointerDown}
            onPointerMove={dragHandleProps.onPointerMove}
            onPointerUp={dragHandleProps.onPointerUp}
            onPointerCancel={dragHandleProps.onPointerCancel}
            className={[
              "shrink-0 p-1 -ml-1 rounded touch-none",
              "text-gray-300 hover:text-gray-500",
              "cursor-grab active:cursor-grabbing",
              "border-none bg-transparent",
              "inline-flex items-center justify-center",
            ].join(" ")}
          >
            <GripIcon />
          </button>
        )}

        {/* 제목 — 인라인 편집 */}
        {isTitleEditing ? (
          <input
            type="text"
            value={titleDraft}
            autoFocus
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitleEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitTitleEdit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancelTitleEdit();
              }
            }}
            placeholder={TITLE_PLACEHOLDER}
            aria-label="여행 기록 제목"
            className={[
              "flex-1 min-w-0 px-2 py-1 rounded-md",
              "bg-white border border-gray-300",
              "font-pretendard text-body2 font-semibold text-gray-900",
              "placeholder:text-gray-400 placeholder:font-normal",
              "outline-none focus:border-gray-700 transition-colors",
            ].join(" ")}
          />
        ) : onSaveMainTitle && !isEditing ? (
          /* 편집 가능한 제목 — 탭하면 input으로 전환 */
          <button
            type="button"
            onClick={startTitleEdit}
            aria-label={`제목 편집: ${displayTitle}`}
            className={[
              "flex-1 min-w-0 text-left px-2 py-1 -mx-1 rounded-md",
              "font-pretendard text-body2 font-semibold truncate",
              "border-none bg-transparent cursor-text",
              "hover:bg-gray-100 transition-colors",
              isTitlePlaceholder ? "text-gray-400" : "text-gray-900",
            ].join(" ")}
          >
            {displayTitle}
          </button>
        ) : (
          /* 읽기 전용 제목 */
          <span
            className={[
              "flex-1 min-w-0 px-1 truncate",
              "font-pretendard text-body2 font-semibold",
              isTitlePlaceholder ? "text-gray-400" : "text-gray-900",
            ].join(" ")}
          >
            {displayTitle}
          </span>
        )}

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
                  aria-label="여행 기록 편집"
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
                  aria-label="여행 기록 삭제"
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

      {/* ── 한 줄 여행 ── */}
      <div className="shrink-0 px-4 py-4 flex flex-col gap-3 border-t border-gray-200">
        <SectionLabel
          label="한줄 여행"
          rightSlot={
            isEditing ? (
              <WeatherRowEdit
                weather={draftWeather}
                onChange={setDraftWeather}
              />
            ) : (
              <WeatherRowView weather={weather} />
            )
          }
        />
        {isEditing ? (
          <input
            type="text"
            value={draftSummary}
            onChange={(e) => setDraftSummary(e.target.value)}
            placeholder="오늘의 한 줄을 적어보세요."
            aria-label="한 줄 여행"
            className={[
              "w-full px-3 py-2 rounded-md",
              "bg-white border border-gray-300",
              "font-pretendard text-body3 text-gray-900",
              "placeholder:text-gray-400",
              "outline-none focus:border-gray-700 transition-colors",
            ].join(" ")}
          />
        ) : (
          oneLineSummary && (
            <p className="font-pretendard text-body2 font-semibold text-gray-900 m-0 leading-snug break-keep">
              {oneLineSummary}
            </p>
          )
        )}
      </div>

      {/* ── 본문 ── */}
      <div className="flex-1 px-4 py-4 flex flex-col gap-2 border-t border-gray-200">
        {isEditing ? (
          <>
            <span className="font-pretendard text-body4 font-medium text-gray-500">
              본문
            </span>
            <BodyEditor
              initialContent={draftContent}
              onChange={setDraftContent}
              registerObjectUrl={registerObjectUrl}
              sharedAlbumPhotos={sharedAlbumPhotos ?? []}
            />
          </>
        ) : (
          <BodyView content={content} />
        )}
      </div>

      {/* ── 앨범 (점선 구분) ── */}
      <div className="shrink-0 px-4 py-4 flex flex-col gap-3 border-t border-dashed border-gray-300">
        <SectionLabel label="앨범" />
        {isEditing ? (
          <PhotoGridEdit
            photos={draftPhotos}
            onAdd={addPhotos}
            onRemove={removePhoto}
            alt="앨범"
          />
        ) : albumPhotos && albumPhotos.length > 0 ? (
          <PhotoGridView photos={albumPhotos} alt="앨범" />
        ) : (
          <div
            className={[
              "h-20 rounded-lg border border-dashed border-gray-300",
              "flex items-center justify-center",
              "font-pretendard text-body4 text-gray-400",
            ].join(" ")}
          >
            등록된 사진이 없습니다.
          </div>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      <ConfirmPopup
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete?.();
        }}
        title="이 여행 기록을 삭제하시겠어요?"
        description={
          "삭제하면 이 카드의 여행 기록과\n첨부된 사진이 모두 사라지며, 되돌릴 수 없습니다."
        }
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="danger"
      />
    </article>
  );
}
