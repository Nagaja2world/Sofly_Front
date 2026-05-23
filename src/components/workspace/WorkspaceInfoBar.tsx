import { useState, useEffect, useRef } from "react";
import { resolveCoverImage, type Workspace } from "@/api/workspaceApi";

interface WorkspaceInfoBarProps {
  workspace: Workspace;
  onSave: (title: string, destination: string, startDate: string, endDate: string) => Promise<void>;
  onSaveImage: (file: File) => Promise<void>;
}

export default function WorkspaceInfoBar({ workspace, onSave, onSaveImage }: WorkspaceInfoBarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState(workspace.title);
  const [destination, setDestination] = useState(workspace.destination);

  /* 커버 이미지 */
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setTitle(workspace.title);
    setDestination(workspace.destination);
  }, [workspace]);

  const handleCancel = () => {
    setTitle(workspace.title);
    setDestination(workspace.destination);
    setImageFile(null);
    setImagePreview(null);
    setIsEditing(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(title, destination, workspace.startDate, workspace.endDate);
      if (imageFile) {
        await onSaveImage(imageFile);
      }
      setImageFile(null);
      setImagePreview(null);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = [
    "font-pretendard text-body3 text-gray-900 rounded-lg border border-gray-300",
    "px-2.5 py-1.5 focus:outline-none focus:border-primary bg-white w-full",
  ].join(" ");

  if (isEditing) {
    const currentCover = resolveCoverImage(workspace.coverImageUrl, workspace.id);

    return (
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex flex-col gap-3">
        {/* 커버 이미지 */}
        <div className="flex flex-col gap-1">
          <label className="font-pretendard text-body5 text-gray-500">커버 이미지</label>
          <div className="flex items-center gap-3">
            <img
              src={imagePreview ?? currentCover}
              alt="커버 이미지"
              className="w-16 h-16 rounded-lg object-cover border border-gray-200 shrink-0"
            />
            <label className={[
              "inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-gray-300",
              "font-pretendard text-body4 text-gray-600 cursor-pointer",
              "hover:border-gray-400 hover:bg-gray-50 transition-colors",
              isSaving ? "opacity-50 pointer-events-none" : "",
            ].join(" ")}>
              이미지 변경
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
                disabled={isSaving}
              />
            </label>
            {imageFile && (
              <span className="font-pretendard text-body5 text-gray-400 truncate max-w-[160px]">
                {imageFile.name}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="font-pretendard text-body5 text-gray-500">여행 제목</label>
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="여행 제목"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-pretendard text-body5 text-gray-500">목적지</label>
            <input
              className={inputClass}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="목적지"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className={[
              "font-pretendard text-body4 px-4 py-1.5 rounded-lg border border-gray-300",
              "text-gray-600 hover:bg-gray-50 cursor-pointer bg-transparent transition-colors",
              isSaving ? "opacity-50 cursor-not-allowed" : "",
            ].join(" ")}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={[
              "font-pretendard text-body4 px-4 py-1.5 rounded-lg border-none",
              "bg-primary text-gray-900 font-semibold cursor-pointer hover:brightness-95 transition-all",
              isSaving ? "opacity-50 cursor-not-allowed" : "",
            ].join(" ")}
          >
            {isSaving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-6 min-w-0">
        <span className="font-pretendard text-body2 font-semibold text-gray-900 truncate">
          {workspace.title}
        </span>
        <span className="font-pretendard text-body4 text-gray-500 shrink-0">
          {workspace.destination !== "string" ? workspace.destination : "목적지 미정"}
        </span>
        <span className="font-pretendard text-body4 text-gray-500 shrink-0">
          {workspace.startDate} ~ {workspace.endDate}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className={[
          "shrink-0 font-pretendard text-body5 text-gray-500 px-3 py-1.5 rounded-lg",
          "border border-gray-200 hover:border-gray-400 hover:text-gray-700",
          "bg-transparent cursor-pointer transition-colors",
        ].join(" ")}
      >
        편집
      </button>
    </div>
  );
}
