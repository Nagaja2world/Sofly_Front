interface DangerZoneProps {
  myRole: string | null;
  onLeave: () => void;
  onDelete: () => void;
}

export default function DangerZone({ myRole, onLeave, onDelete }: DangerZoneProps) {
  if (myRole === null) return null;

  return (
    <section className="flex flex-col gap-4 pb-6">
      <div className="border-t border-gray-200 pt-6 flex flex-col gap-4">
        {/* 워크스페이스 나가기: OWNER가 아닌 멤버에게만 표시 */}
        {myRole !== "OWNER" && (
          <div>
            <button
              type="button"
              onClick={onLeave}
              className={[
                "font-pretendard text-body3 font-semibold px-5 py-2.5 rounded-xl",
                "border border-orange-300 text-orange-500 bg-transparent",
                "hover:bg-orange-50 hover:border-orange-400 transition-colors cursor-pointer",
              ].join(" ")}
            >
              워크스페이스 나가기
            </button>
            <p className="font-pretendard text-body5 text-gray-400 m-0 mt-1.5">
              나가면 다시 초대를 받아야 참여할 수 있습니다.
            </p>
          </div>
        )}

        {/* 워크스페이스 삭제: OWNER에게만 표시 */}
        {myRole === "OWNER" && (
          <div>
            <button
              type="button"
              onClick={onDelete}
              className={[
                "font-pretendard text-body3 font-semibold px-5 py-2.5 rounded-xl",
                "border border-red-300 text-red-500 bg-transparent",
                "hover:bg-red-50 hover:border-red-400 transition-colors cursor-pointer",
              ].join(" ")}
            >
              워크스페이스 삭제
            </button>
            <p className="font-pretendard text-body5 text-gray-400 m-0 mt-1.5">
              삭제된 워크스페이스는 복구할 수 없습니다.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
