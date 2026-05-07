import type { VisitStatus } from "@/api/conquestApi";

export type RouteFilter = "all" | "none" | number;

export type ModalCtx =
  | { type: "country"; id: string; name: string; status: VisitStatus }
  | { type: "city"; id: number; name: string; status: VisitStatus };
