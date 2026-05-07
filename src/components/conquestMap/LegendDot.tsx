import { C } from "./constants";

interface Props {
  color: string;
  label: string;
  outline?: boolean;
}

export function LegendDot({ color, label, outline }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: C.subtle }}>
      <div style={{
        width: 10, height: 10, borderRadius: 99,
        background: outline ? "transparent" : color,
        border: outline ? `1.5px solid ${color}` : "none",
        flexShrink: 0,
      }} />
      {label}
    </div>
  );
}
