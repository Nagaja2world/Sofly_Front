/* ══════════════════════════════════════════
   CompactDangerZone
   ══════════════════════════════════════════
   좁은 화면(< 768px)용 워크스페이스 위험 작업 영역.
   본문 맨 아래(공유 앨범 섹션 다음)에 위치.

   데스크톱 DangerZone과의 차이:
   - 동작/조건은 동일:
     · myRole === null  → 아무것도 렌더하지 않음 (역할 로딩 전)
     · myRole !== "OWNER" → "워크스페이스 나가기" (주황)
     · myRole === "OWNER" → "워크스페이스 삭제" (빨강)
   - 모바일은 가로 폭이 좁으므로 버튼을 폭 100%(블록)로 키워
     탭 타깃을 넉넉히 확보. 데스크톱은 내용폭 버튼.
   - 실제 확인 모달(나가기/삭제)은 데스크톱과 마찬가지로
     WorkspacePage가 페이지 레벨에서 관리하므로 여기서는
     onLeave / onDelete 콜백만 호출.

   섹션 제목은 다른 compact 섹션과 톤을 맞추되, 위험 영역임을
   드러내기 위해 상단 구분선을 둠.
*/

interface CompactDangerZoneProps {
  /** 현재 사용자 역할. null이면 렌더하지 않음. */
  myRole: string | null;
  /** 워크스페이스 나가기 — OWNER가 아닌 멤버용 */
  onLeave: () => void;
  /** 워크스페이스 삭제 — OWNER용 */
  onDelete: () => void;
}

export default function CompactDangerZone({
  myRole,
  onLeave,
  onDelete,
}: CompactDangerZoneProps) {
  /* 역할 로딩 전에는 어느 버튼을 보일지 알 수 없으므로 렌더 보류.
     (데스크톱 DangerZone과 동일한 조건) */
  if (myRole === null) return null;

  const isOwner = myRole === "OWNER";

  return (
    <section className="flex flex-col gap-3 pt-2">
      {/* 상단 구분선 — 위험 영역임을 시각적으로 분리 */}
      <div className="border-t border-gray-200" />

      {!isOwner && (
        /* ── 워크스페이스 나가기 (OWNER 아님) ── */
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={onLeave}
            className={[
              "w-full h-11 rounded-xl",
              "font-pretendard text-body3 font-semibold",
              "border border-orange-300 text-orange-500 bg-transparent",
              "active:bg-orange-50 transition-colors cursor-pointer",
            ].join(" ")}
          >
            워크스페이스 나가기
          </button>
          <p className="font-pretendard text-body5 text-gray-400 m-0">
            나가면 다시 초대를 받아야 참여할 수 있습니다.
          </p>
        </div>
      )}

      {isOwner && (
        /* ── 워크스페이스 삭제 (OWNER) ── */
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={onDelete}
            className={[
              "w-full h-11 rounded-xl",
              "font-pretendard text-body3 font-semibold",
              "border border-red-300 text-red-500 bg-transparent",
              "active:bg-red-50 transition-colors cursor-pointer",
            ].join(" ")}
          >
            워크스페이스 삭제
          </button>
          <p className="font-pretendard text-body5 text-gray-400 m-0">
            삭제된 워크스페이스는 복구할 수 없습니다.
          </p>
        </div>
      )}
    </section>
  );
}
