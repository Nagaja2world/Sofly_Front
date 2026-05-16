import { useState, useCallback } from 'react';
import type { JSONContent } from '@tiptap/core';
import type { WeatherType, TravelLogData } from '@/components/workspace/TravelLogCard';
import type { TravelLog } from '@/components/workspace/TravelLogSection';
import {
  fetchTravellogs,
  fetchTravellog,
  createTravellog,
  updateTravellog,
  deleteTravellog,
  uploadTravellogPhotos,
  type WeatherApi,
  type TravellogResponse,
} from '@/api/travellogApi';

/* ── 타입 변환 유틸 ── */

const WEATHER_API_TO_UI: Record<WeatherApi, WeatherType> = {
  SUNNY: 'sunny',
  CLOUDY: 'cloudy',
  RAINY: 'rainy',
  SNOWY: 'snowy',
};

const WEATHER_UI_TO_API: Record<WeatherType, WeatherApi> = {
  sunny: 'SUNNY',
  cloudy: 'CLOUDY',
  rainy: 'RAINY',
  snowy: 'SNOWY',
};

/** 마크다운 문자열 → Tiptap JSONContent (단순 paragraph 분리) */
function markdownToTiptap(markdown: string): JSONContent | undefined {
  if (!markdown?.trim()) return undefined;
  const paragraphs = markdown.split(/\n\n+/).filter(Boolean);
  return {
    type: 'doc',
    content: paragraphs.map((text) => ({
      type: 'paragraph',
      content: text.trim() ? [{ type: 'text', text: text.trim() }] : [],
    })),
  };
}

/** Tiptap JSONContent → 마크다운 문자열 (텍스트 노드만 추출) */
function tiptapToMarkdown(json: JSONContent | undefined): string {
  if (!json) return '';
  const lines: string[] = [];
  const walk = (node: JSONContent) => {
    if (node.type === 'text' && typeof node.text === 'string') {
      lines.push(node.text);
    } else if (node.type === 'paragraph') {
      const texts: string[] = [];
      (node.content ?? []).forEach((child) => {
        if (child.type === 'text' && child.text) texts.push(child.text);
      });
      lines.push(texts.join(''));
    } else {
      (node.content ?? []).forEach(walk);
    }
  };
  (json.content ?? []).forEach(walk);
  return lines.join('\n\n');
}

/** API 응답 → UI TravelLog */
function apiToTravelLog(res: TravellogResponse): TravelLog {
  return {
    id: res.id,
    dayNumber: res.day ?? res.id,
    oneLineSummary: res.title,
    weather: res.weather ? WEATHER_API_TO_UI[res.weather] : undefined,
    content: markdownToTiptap(res.content),
    albumPhotos: res.photos.map((p) => p.url),
    _photoIds: res.photos.map((p) => p.id),
  };
}

/* ── 훅 ── */

export function useTravelLogs(workspaceId: number) {
  const [travelLogs, setTravelLogs] = useState<TravelLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** 목록 로드 (summary만) — 카드 렌더에 필요한 title, weather, photoCount */
  const loadTravelLogs = useCallback(async () => {
    if (!workspaceId || isNaN(workspaceId)) return;
    setIsLoading(true);
    setError(null);
    try {
      const summaries = await fetchTravellogs(workspaceId);
      // summary에는 content가 없으므로 단건 조회로 content 포함 로드
      const details = await Promise.all(
        summaries.map((s) => fetchTravellog(workspaceId, s.id)),
      );
      setTravelLogs(details.map(apiToTravelLog));
    } catch (err) {
      console.warn('[useTravelLogs] 목록 로드 실패:', err);
      setError('여행 기록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  /** 일자별 카드 추가 */
  const handleAddDailyCard = useCallback(async () => {
    const nextDay = travelLogs.length > 0
      ? Math.max(...travelLogs.map((l) => l.dayNumber)) + 1
      : 1;
    try {
      const res = await createTravellog(workspaceId, {
        title: `${nextDay}일차 여행 기록`,
        content: '',
        day: nextDay,
      });
      setTravelLogs((prev) => [...prev, apiToTravelLog(res)]);
    } catch (err) {
      console.warn('[useTravelLogs] 카드 추가 실패:', err);
    }
  }, [workspaceId, travelLogs]);

  /** 카드 저장 (수정) */
  const handleSaveTravelLog = useCallback(async (
    logId: number,
    data: TravelLogData,
    files?: File[],
  ) => {
    try {
      // 텍스트/날씨 수정
      const payload = {
        title: data.oneLineSummary ?? null,
        content: tiptapToMarkdown(data.content) || null,
        weather: data.weather ? WEATHER_UI_TO_API[data.weather] : null,
      };
      let res = await updateTravellog(workspaceId, logId, payload);

      // 새 파일 업로드가 있으면 추가 요청
      if (files && files.length > 0) {
        res = await uploadTravellogPhotos(workspaceId, logId, files);
      }

      setTravelLogs((prev) =>
        prev.map((log) => (log.id === logId ? apiToTravelLog(res) : log)),
      );
    } catch (err) {
      console.warn('[useTravelLogs] 저장 실패:', err);
    }
  }, [workspaceId]);

  /** 카드 삭제 */
  const handleDeleteTravelLog = useCallback(async (logId: number) => {
    try {
      await deleteTravellog(workspaceId, logId);
      setTravelLogs((prev) => prev.filter((log) => log.id !== logId));
    } catch (err) {
      console.warn('[useTravelLogs] 삭제 실패:', err);
    }
  }, [workspaceId]);

  return {
    travelLogs,
    isLoading,
    error,
    loadTravelLogs,
    handleAddDailyCard,
    handleSaveTravelLog,
    handleDeleteTravelLog,
  };
}
