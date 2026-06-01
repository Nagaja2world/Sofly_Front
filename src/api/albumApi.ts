const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function authHeadersMultipart(): HeadersInit {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface ApiResponse<T> {
  success: boolean;
  code?: string;
  message?: string;
  data: T;
}

async function unwrap<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  if (res.status === 413) throw new Error('FILE_TOO_LARGE');
  const json: ApiResponse<T> = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message ?? `API 오류: ${res.status}`);
  return json.data;
}

export interface AlbumPhoto {
  id: number;
  url: string;
  uploadedById: number;
  uploadedByNickname: string;
  takenAt: string | null;
  createdAt: string;
}

export interface AlbumResponse {
  albumId: number;
  workspaceId: number;
  photos: AlbumPhoto[];
  page: number;
  size: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
}

const ALBUM_PAGE_SIZE = 40;

/** 앨범 조회 (페이징) */
export async function fetchAlbum(
  workspaceId: number,
  page = 0,
  size = ALBUM_PAGE_SIZE,
): Promise<AlbumResponse> {
  const res = await fetch(
    `${API_BASE}/api/workspaces/${workspaceId}/album?page=${page}&size=${size}`,
    { headers: authHeaders() },
  );
  return unwrap<AlbumResponse>(res);
}

/** 사진 업로드 */
export async function uploadAlbumPhotos(
  workspaceId: number,
  files: File[],
): Promise<AlbumPhoto[]> {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));
  const res = await fetch(
    `${API_BASE}/api/workspaces/${workspaceId}/album/photos`,
    { method: "POST", headers: authHeadersMultipart(), body: formData },
  );
  return unwrap<AlbumPhoto[]>(res);
}

/** 다운로드 URL 발급 */
export async function getPhotoDownloadUrl(
  workspaceId: number,
  photoId: number,
): Promise<string> {
  const res = await fetch(
    `${API_BASE}/api/workspaces/${workspaceId}/album/photos/${photoId}/download`,
    { headers: authHeaders() },
  );
  const data = await unwrap<{ downloadUrl: string } | string>(res);
  return typeof data === "string" ? data : (data as { downloadUrl: string }).downloadUrl;
}

/** 사진 삭제 */
export async function deleteAlbumPhoto(
  workspaceId: number,
  photoId: number,
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/workspaces/${workspaceId}/album/photos/${photoId}`,
    { method: "DELETE", headers: authHeaders() },
  );
  await unwrap<void>(res);
}
