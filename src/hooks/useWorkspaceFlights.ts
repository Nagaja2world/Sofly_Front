import { useState, useCallback } from "react";
import {
  fetchWorkspaceFlights,
  deleteFlightFromWorkspace,
  type WorkspaceFlight,
} from "@/api/workspaceApi";
import { type FlightInfo } from "@/components/workspace/FlightSection";

function formatKoreanTime(iso: string): { meridiem: "오전" | "오후"; time: string } {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const meridiem: "오전" | "오후" = h < 12 ? "오전" : "오후";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return { meridiem, time: `${hour}:${String(m).padStart(2, "0")}` };
}

function formatKoreanDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function mapWorkspaceFlightToFlightInfo(wf: WorkspaceFlight): FlightInfo {
  const dep = formatKoreanTime(wf.departureTime);
  const arr = formatKoreanTime(wf.arrivalTime);

  const durationStr =
    wf.durationMinutes != null
      ? `${Math.floor(wf.durationMinutes / 60)}시간${wf.durationMinutes % 60 > 0 ? ` ${wf.durationMinutes % 60}분` : ""}`
      : "";

  return {
    id: wf.id,
    direction: wf.flightType === "OUTBOUND" ? "가는편" : "오는편",
    date: formatKoreanDate(wf.departureTime),
    legs: [
      {
        meridiem: dep.meridiem,
        time: dep.time,
        airportCode: wf.departureAirport,
        airportName: wf.departureCity ?? wf.departureAirport,
        duration: durationStr,
        airline: wf.airline,
        airlineLogo: wf.airlineLogo ?? undefined,
        flightNo: wf.flightNumber,
      },
      {
        meridiem: arr.meridiem,
        time: arr.time,
        airportCode: wf.arrivalAirport,
        airportName: wf.arrivalCity ?? wf.arrivalAirport,
        duration: durationStr,
        airline: wf.airline,
        airlineLogo: wf.airlineLogo ?? undefined,
        flightNo: wf.flightNumber,
      },
    ],
  };
}

export function useWorkspaceFlights(workspaceId: number) {
  const [flights, setFlights] = useState<FlightInfo[]>([]);
  const [rawFlights, setRawFlights] = useState<WorkspaceFlight[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<WorkspaceFlight | null>(null);
  const [deleteFlightTarget, setDeleteFlightTarget] = useState<{ id: number; label: string } | null>(null);

  const loadFlights = useCallback(async () => {
    if (!workspaceId || isNaN(workspaceId)) return;
    try {
      const data = await fetchWorkspaceFlights(workspaceId);
      setRawFlights(data);
      setFlights(data.map(mapWorkspaceFlightToFlightInfo));
    } catch (err) {
      console.warn("[useWorkspaceFlights] 항공 일정 로드 실패:", err);
    }
  }, [workspaceId]);

  const handleDeleteFlightConfirm = async () => {
    if (!deleteFlightTarget) return;
    try {
      await deleteFlightFromWorkspace(workspaceId, deleteFlightTarget.id);
      setFlights((prev) => prev.filter((f) => f.id !== deleteFlightTarget.id));
    } catch (err) {
      console.warn("[useWorkspaceFlights] 항공편 삭제 실패:", err);
    } finally {
      setDeleteFlightTarget(null);
    }
  };

  return {
    flights,
    rawFlights,
    loadFlights,
    selectedFlight,
    setSelectedFlight,
    deleteFlightTarget,
    setDeleteFlightTarget,
    handleDeleteFlightConfirm,
  };
}
