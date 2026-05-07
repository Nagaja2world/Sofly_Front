import { C } from "./constants";
import { pillBtn } from "./utils";

interface Props {
  json: string;
  loading: boolean;
  onJsonChange: (val: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function BulkImportModal({ json, loading, onJsonChange, onSubmit, onClose }: Props) {
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, background: "rgba(43,43,43,0.4)",
        zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div style={{
        background: C.white, borderRadius: 16,
        border: `1px solid ${C.border}`, padding: 24,
        width: 480, display: "flex", flexDirection: "column", gap: 16,
        boxShadow: "0 20px 60px rgba(43,43,43,0.12)",
        fontFamily: "Pretendard, -apple-system, sans-serif",
      }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: C.text }}>과거 방문 일괄 등록</h3>
          <p style={{ fontSize: 12, color: C.muted }}>JSON 형식으로 국가/도시를 한번에 등록합니다</p>
        </div>

        <textarea
          value={json}
          onChange={(e) => onJsonChange(e.target.value)}
          style={{
            background: C.bg, border: `1px solid ${C.borderMid}`,
            borderRadius: 8, padding: 12, color: C.text,
            fontSize: 11, fontFamily: "monospace",
            resize: "vertical", minHeight: 200, width: "100%", outline: "none",
          }}
        />

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={pillBtn()}>취소</button>
          <button
            onClick={onSubmit}
            disabled={loading}
            style={{ ...pillBtn(true), opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "등록 중..." : "등록"}
          </button>
        </div>
      </div>
    </div>
  );
}
