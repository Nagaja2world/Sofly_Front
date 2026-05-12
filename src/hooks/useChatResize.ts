import { useState, useRef, useCallback } from "react";

const CHAT_MIN_WIDTH = 280;
const CHAT_MAX_WIDTH = 720;

export function useChatResize(initialWidth = 420) {
  const [chatWidth, setChatWidth] = useState(initialWidth);
  const resizingRef = useRef(false);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(0);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      resizingRef.current = true;
      resizeStartXRef.current = e.clientX;
      resizeStartWidthRef.current = chatWidth;

      const onMove = (ev: MouseEvent) => {
        if (!resizingRef.current) return;
        const delta = resizeStartXRef.current - ev.clientX;
        const next = Math.min(
          CHAT_MAX_WIDTH,
          Math.max(CHAT_MIN_WIDTH, resizeStartWidthRef.current + delta),
        );
        setChatWidth(next);
      };

      const onUp = () => {
        resizingRef.current = false;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [chatWidth],
  );

  return { chatWidth, handleResizeStart };
}
