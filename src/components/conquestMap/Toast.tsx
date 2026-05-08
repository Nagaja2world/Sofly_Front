import { C } from "./constants";

interface Props {
  msg: string;
  type: "ok" | "err";
}

export function Toast({ msg, type }: Props) {
  return (
    <div style={{
      position: "fixed", bottom: 70, left: "50%", transform: "translateX(-50%)",
      background: C.white,
      border: `1px solid ${type === "ok" ? "rgba(5,150,105,0.3)" : "rgba(239,68,68,0.3)"}`,
      borderRadius: 10, padding: "10px 16px", fontSize: 12, zIndex: 300,
      color: type === "ok" ? "#059669" : "#dc2626",
      fontFamily: "Pretendard, -apple-system, sans-serif",
      boxShadow: "0 4px 16px rgba(43,43,43,0.08)",
      whiteSpace: "nowrap",
    }}>
      {msg}
    </div>
  );
}
