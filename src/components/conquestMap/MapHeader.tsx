import { useNavigate } from "react-router-dom";
import { C } from "./constants";
import { pillBtn } from "./utils";

interface Props {
  envToken: string | undefined;
  tokenInput: string;
  onTokenInputChange: (val: string) => void;
  onTokenSubmit: () => void;
}

export function MapHeader({
  envToken,
  tokenInput,
  onTokenInputChange,
  onTokenSubmit,
}: Props) {
  const navigate = useNavigate();

  return (
    <header style={{
      height: 64, background: C.white,
      borderBottom: `1px solid ${C.border}`,
      padding: "0 24px", display: "flex", alignItems: "center", gap: 16,
      flexShrink: 0, zIndex: 200,
    }}>
      {/* Logo */}
      <button
        onClick={() => navigate("/")}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "none", border: "none", cursor: "pointer", padding: 0,
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: `linear-gradient(135deg, ${C.primary}, #f0c043)`,
          display: "grid", placeItems: "center",
          boxShadow: `0 2px 8px rgba(245,209,90,0.35)`,
          flexShrink: 0,
        }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth={2.2}>
            <circle cx={12} cy={12} r={9} />
            <path d="M3 12h18 M12 3a14 14 0 0 1 4 9 14 14 0 0 1-4 9 14 14 0 0 1-4-9 14 14 0 0 1 4-9z" />
          </svg>
        </div>
        <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 18, color: C.text }}>
          sofly
        </span>
      </button>

      <div style={{ width: 1, height: 20, background: C.borderMid }} />
      <span style={{ fontSize: 14, fontWeight: 600, color: C.subtle }}>Conquest Map</span>

      <div style={{ flex: 1 }} />

      {/* Token input (only if no env token) */}
      {!envToken && (
        <>
          <input
            value={tokenInput}
            onChange={(e) => onTokenInputChange(e.target.value)}
            placeholder="Mapbox Token (pk.eyJ1...)"
            style={{
              background: C.bg, border: `1px solid ${C.borderMid}`,
              borderRadius: 8, padding: "6px 10px",
              color: C.text, fontSize: 12, fontFamily: "monospace",
              width: 200, outline: "none",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && tokenInput.trim()) onTokenSubmit();
            }}
          />
          <button
            onClick={() => { if (tokenInput.trim()) onTokenSubmit(); }}
            disabled={!tokenInput.trim()}
            style={{ ...pillBtn(true), opacity: tokenInput.trim() ? 1 : 0.4 }}
          >
            지도 로드
          </button>
          <div style={{ width: 1, height: 20, background: C.borderMid }} />
        </>
      )}

    </header>
  );
}
