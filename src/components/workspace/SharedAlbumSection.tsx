import { useRef, useState, type ChangeEvent } from "react";
import PlusIcon from "@/assets/plus.svg?react";
import ConfirmPopup from "@/components/common/ConfirmPopup";
import PhotoLightbox from "@/components/workspace/PhotoLightbox";
import type { AlbumPhoto } from "@/api/albumApi";

const COLS = 8;

interface SharedAlbumSectionProps {
  photos: AlbumPhoto[];
  uploading?: boolean;
  hasNext?: boolean;
  loadingMore?: boolean;
  onAddPhotos: (files: FileList) => void;
  onRemovePhoto: (photoId: number) => void;
  onDownloadPhoto: (photoId: number) => void;
  onLoadMore?: () => void;
  className?: string;
}

export default function SharedAlbumSection({
  photos,
  uploading = false,
  hasNext = false,
  loadingMore = false,
  onAddPhotos,
  onRemovePhoto,
  onDownloadPhoto,
  onLoadMore,
  className = "",
}: SharedAlbumSectionProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFilePicker = () => fileInputRef.current?.click();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddPhotos(e.target.files);
      e.target.value = "";
    }
  };

  const handleConfirmDelete = () => {
    if (deleteTargetId !== null) onRemovePhoto(deleteTargetId);
    setDeleteTargetId(null);
  };

  const photoUrls = photos.map((p) => p.url);

  const safeLightboxIndex =
    lightboxIndex === null || photos.length === 0
      ? null
      : Math.min(lightboxIndex, photos.length - 1);

  return (
    <section className={`flex flex-col gap-3 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <h2 className="font-pretendard text-title2 font-semibold text-gray-900 m-0">
          공유 앨범
        </h2>
        <button
          type="button"
          onClick={triggerFilePicker}
          disabled={uploading}
          aria-label="공유 앨범에 사진 추가"
          className={[
            "inline-flex items-center justify-center",
            "w-8 h-8 rounded-full transition-colors border-none bg-transparent",
            uploading
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 cursor-pointer",
          ].join(" ")}
        >
          <PlusIcon className="w-4 h-4" />
        </button>
        {uploading && (
          <span className="font-pretendard text-body4 text-gray-400">
            업로드 중...
          </span>
        )}
      </div>

      {/* 앨범 박스 */}
      <div className="rounded-xl border border-gray-300 bg-white p-4 flex flex-col gap-3">
        {photos.length > 0 ? (
          <>
            <div
              className="grid gap-1 w-full"
              style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
            >
              {photos.map((photo, i) => (
                <PhotoCell
                  key={photo.id}
                  photo={photo}
                  index={i}
                  onClick={() => setLightboxIndex(i)}
                  onRemove={() => setDeleteTargetId(photo.id)}
                  onDownload={() => onDownloadPhoto(photo.id)}
                />
              ))}
            </div>
            {hasNext && (
              <button
                type="button"
                onClick={onLoadMore}
                disabled={loadingMore}
                className={[
                  "w-full py-2.5 rounded-lg",
                  "font-pretendard text-body3 font-medium",
                  "border border-gray-300 bg-white",
                  loadingMore
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-50 hover:border-gray-400 cursor-pointer",
                  "transition-colors",
                ].join(" ")}
              >
                {loadingMore ? "로딩 중..." : "더 보기"}
              </button>
            )}
          </>
        ) : (
          <EmptyAlbumPlaceholder onAddClick={triggerFilePicker} />
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      <PhotoLightbox
        photos={photoUrls}
        index={safeLightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
        alt="공유 앨범"
      />

      <ConfirmPopup
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="사진을 삭제하시겠어요?"
        description={"공유 앨범에서 해당 사진이 제거됩니다.\n되돌릴 수 없습니다."}
      />
    </section>
  );
}

function PhotoCell({
  photo,
  index,
  onClick,
  onRemove,
  onDownload,
}: {
  photo: AlbumPhoto;
  index: number;
  onClick: () => void;
  onRemove: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="relative aspect-square overflow-hidden bg-gray-200 group">
      {/* 사진 */}
      <button
        type="button"
        onClick={onClick}
        aria-label={`공유 앨범 사진 ${index + 1} 확대 보기`}
        className="w-full h-full block border-none bg-transparent p-0 cursor-pointer"
      >
        <img
          src={photo.url}
          alt={`공유 앨범 사진 ${index + 1}`}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
        />
      </button>

      {/* 어두운 오버레이 */}
      <div
        className="absolute inset-0 pointer-events-none bg-black/0 group-hover:bg-black/20 transition-colors"
        aria-hidden="true"
      />

      {/* 다운로드 버튼 (좌상단) */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDownload(); }}
        aria-label={`공유 앨범 사진 ${index + 1} 다운로드`}
        className={[
          "absolute top-1.5 left-1.5",
          "w-7 h-7 rounded-full",
          "inline-flex items-center justify-center",
          "bg-gray-900/70 text-white",
          "border-none cursor-pointer",
          "opacity-0 group-hover:opacity-100 focus:opacity-100",
          "transition-opacity hover:bg-gray-900/90",
        ].join(" ")}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path
            d="M6 1v7M3 6l3 3 3-3M1 11h10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* 삭제 버튼 (우상단) */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        aria-label={`공유 앨범 사진 ${index + 1} 삭제`}
        className={[
          "absolute top-1.5 right-1.5",
          "w-7 h-7 rounded-full",
          "inline-flex items-center justify-center",
          "bg-gray-900/70 text-white",
          "border-none cursor-pointer",
          "opacity-0 group-hover:opacity-100 focus:opacity-100",
          "transition-opacity hover:bg-gray-900/90",
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

function EmptyAlbumPlaceholder({ onAddClick }: { onAddClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onAddClick}
      className={[
        "w-full py-16 px-6 rounded-lg",
        "border-2 border-dashed border-gray-300",
        "bg-gray-50 hover:bg-gray-100 hover:border-gray-400",
        "transition-colors cursor-pointer",
        "flex flex-col items-center justify-center gap-3",
        "focus-visible:outline-none focus-visible:border-gray-700",
      ].join(" ")}
      aria-label="공유 앨범에 첫 사진 추가하기"
    >
      <span
        className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white text-gray-700"
        aria-hidden="true"
      >
        <PlusIcon className="w-6 h-6" />
      </span>
      <span className="flex flex-col items-center gap-1">
        <span className="font-pretendard text-body1 font-semibold text-gray-900">
          첫 사진을 공유해보세요
        </span>
        <span className="font-pretendard text-body4 text-gray-500">
          여행에서 함께 찍은 사진을 모아둘 수 있어요
        </span>
      </span>
    </button>
  );
}
