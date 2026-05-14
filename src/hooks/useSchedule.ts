import { useState, useCallback, useRef } from "react";
import {
  fetchLatestSchedule,
  fetchScheduleList,
  fetchScheduleById,
  addScheduleItem,
  updateScheduleItem,
  updateScheduleItemCategory,
  deleteScheduleItem,
  deleteSchedule,
  moveScheduleItem,
  type ScheduleDetail,
  type ScheduleSummary,
  type ScheduleItem,
  type ScheduleCategory,
} from "@/api/scheduleApi";
import { type ItineraryRow } from "@/components/workspace/ItineraryDayCard";
import { type ItineraryDay } from "@/components/workspace/ItinerarySection";

function scheduleItemToRow(item: ScheduleItem): ItineraryRow {
  return {
    id: String(item.id),
    title: item.name,
    visitTime: item.visitTime ?? undefined,
    cost:
      item.estimatedCost != null
        ? `${item.estimatedCost.toLocaleString("ko-KR")}원`
        : undefined,
    remark: item.memo ?? undefined,
    _category: item.category,
    _address: item.address,
    _latitude: item.latitude,
    _longitude: item.longitude,
    _placeId: item.placeId,
    _photoReference: item.photoReference,
    _estimatedCost: item.estimatedCost,
  };
}

function scheduleDetailToItineraryDays(schedule: ScheduleDetail): ItineraryDay[] {
  return Object.entries(schedule.itemsByDay)
    .map(([dayStr, items]) => ({
      dayNumber: parseInt(dayStr, 10),
      rows: [...items].sort((a, b) => a.orderIndex - b.orderIndex).map(scheduleItemToRow),
    }))
    .sort((a, b) => a.dayNumber - b.dayNumber);
}

function parseCostString(cost?: string): number | undefined {
  if (!cost) return undefined;
  const n = parseFloat(cost.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? undefined : n;
}

export function useSchedule(workspaceId: number) {
  const [currentSchedule, setCurrentSchedule] = useState<ScheduleDetail | null>(null);
  const [scheduleList, setScheduleList] = useState<ScheduleSummary[]>([]);
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const scheduleItemsRef = useRef<Map<number, ScheduleItem>>(new Map());

  const applySchedule = useCallback((schedule: ScheduleDetail) => {
    setCurrentSchedule(schedule);
    setItineraryDays(scheduleDetailToItineraryDays(schedule));
    const map = new Map<number, ScheduleItem>();
    for (const items of Object.values(schedule.itemsByDay)) {
      for (const item of items) map.set(item.id, item);
    }
    scheduleItemsRef.current = map;
  }, []);

  const loadSchedule = useCallback(async () => {
    if (!workspaceId || isNaN(workspaceId)) return;
    setIsLoadingSchedule(true);
    try {
      const [latest, list] = await Promise.all([
        fetchLatestSchedule(workspaceId),
        fetchScheduleList(workspaceId),
      ]);
      if (latest) applySchedule(latest);
      else setItineraryDays([]);
      setScheduleList(list);
    } catch (err) {
      console.warn("[useSchedule] 일정 로드 실패:", err);
    } finally {
      setIsLoadingSchedule(false);
    }
  }, [workspaceId, applySchedule]);

  const handleSelectScheduleVersion = async (scheduleId: number) => {
    try {
      const schedule = await fetchScheduleById(scheduleId);
      applySchedule(schedule);
    } catch (err) {
      console.warn("[useSchedule] 일정 버전 로드 실패:", err);
    }
  };

  const handleSaveItineraryDay = async (dayNumber: number, newRows: ItineraryRow[]) => {
    if (!currentSchedule) return;
    const scheduleId = currentSchedule.id;
    const originalRows =
      itineraryDays.find((d) => d.dayNumber === dayNumber)?.rows ?? [];

    setIsSavingSchedule(true);
    try {
      const originalIdSet = new Set(originalRows.map((r) => r.id));
      const newIdSet = new Set(newRows.map((r) => r.id));

      // 1. 삭제된 아이템
      for (const row of originalRows) {
        if (!newIdSet.has(row.id)) {
          const numId = parseInt(row.id, 10);
          if (!isNaN(numId)) await deleteScheduleItem(scheduleId, numId);
        }
      }

      // 2. 추가 / 수정 / 위치 변경
      for (let i = 0; i < newRows.length; i++) {
        const row = newRows[i];
        const isNew = row.id.startsWith("row-");

        if (isNew) {
          await addScheduleItem(scheduleId, {
            day: dayNumber,
            orderIndex: i,
            category: (row._category as ScheduleCategory) ?? "ATTRACTION",
            name: row.title,
            visitTime: row.visitTime || undefined,
            estimatedCost: parseCostString(row.cost),
            memo: row.remark || undefined,
            address: row._address ?? undefined,
            latitude: row._latitude ?? undefined,
            longitude: row._longitude ?? undefined,
            placeId: row._placeId ?? undefined,
            photoReference: row._photoReference ?? undefined,
          });
        } else {
          const itemId = parseInt(row.id, 10);
          if (isNaN(itemId)) continue;

          const origItem = scheduleItemsRef.current.get(itemId);
          const originalRow = originalRows.find((r) => r.id === row.id);

          const originalIndex = originalRows.findIndex((r) => r.id === row.id);
          if (originalIndex !== i) {
            await moveScheduleItem(scheduleId, itemId, dayNumber, i);
          }

          const changed =
            !originalRow ||
            row.title !== originalRow.title ||
            row.visitTime !== originalRow.visitTime ||
            row.cost !== originalRow.cost ||
            row.remark !== originalRow.remark ||
            row._category !== originalRow._category ||
            row._placeId !== originalRow._placeId;

          if (changed || !originalIdSet.has(row.id)) {
            await updateScheduleItem(scheduleId, itemId, {
              category: (row._category ?? "ATTRACTION") as ScheduleCategory,
              name: row.title,
              visitTime: row.visitTime || undefined,
              estimatedCost: parseCostString(row.cost),
              memo: row.remark || undefined,
              address: row._address ?? origItem?.address ?? undefined,
              latitude: row._latitude ?? origItem?.latitude ?? undefined,
              longitude: row._longitude ?? origItem?.longitude ?? undefined,
              placeId: row._placeId ?? origItem?.placeId ?? undefined,
              photoReference: row._photoReference ?? origItem?.photoReference ?? undefined,
            });
          }
        }
      }

      const updated = await fetchScheduleById(scheduleId);
      applySchedule(updated);
    } catch (err) {
      console.error("[useSchedule] 일정 저장 실패:", err);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleCategoryChange = async (itemId: number, category: ScheduleCategory) => {
    if (!currentSchedule) return;
    try {
      const updatedItem = await updateScheduleItemCategory(currentSchedule.id, itemId, category);
      // 로컬 state 즉시 반영 (전체 재조회 없이)
      setItineraryDays((prev) =>
        prev.map((day) => ({
          ...day,
          rows: day.rows.map((row) =>
            row.id === String(updatedItem.id)
              ? { ...row, _category: updatedItem.category }
              : row,
          ),
        })),
      );
      scheduleItemsRef.current.set(itemId, updatedItem);
    } catch (err) {
      console.warn("[useSchedule] 카테고리 변경 실패:", err);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!currentSchedule) return;
    try {
      await deleteScheduleItem(currentSchedule.id, itemId);
      const updated = await fetchScheduleById(currentSchedule.id);
      applySchedule(updated);
    } catch (err) {
      console.warn("[useSchedule] 아이템 삭제 실패:", err);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!currentSchedule) return;
    try {
      await deleteSchedule(currentSchedule.id);
      setCurrentSchedule(null);
      setItineraryDays([]);
      scheduleItemsRef.current = new Map();
      const list = await fetchScheduleList(workspaceId);
      setScheduleList(list);
      if (list.length > 0) {
        const latest = await fetchScheduleById(list[list.length - 1].id);
        applySchedule(latest);
      }
    } catch (err) {
      console.warn("[useSchedule] 일정 삭제 실패:", err);
    }
  };

  return {
    currentSchedule,
    scheduleList,
    itineraryDays,
    isLoadingSchedule,
    isSavingSchedule,
    loadSchedule,
    handleSelectScheduleVersion,
    handleSaveItineraryDay,
    handleCategoryChange,
    handleDeleteItem,
    handleDeleteSchedule,
  };
}
