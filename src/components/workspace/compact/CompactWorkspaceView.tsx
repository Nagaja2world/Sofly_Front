import { useState } from "react";
import NavBar from "@/components/common/NavBar";
import MobileFooter from "@/components/common/MobileFooter";
import MemberBar from "@/components/workspace/compact/MemberBar";
import MemberListPopup from "@/components/workspace/compact/MemberListPopup";
import CompactFlightSection from "@/components/workspace/compact/CompactFlightSection";
import { type WorkspaceMember } from "@/components/workspace/MemberSidebar";
import { type FlightInfo } from "@/components/workspace/FlightSection";
import { type WorkspaceFlight } from "@/api/workspaceApi";

/* ══════════════════════════════════════════
   CompactWorkspaceView
   ══════════════════════════════════════════
   좁은 화면(< 768px)용 워크스페이스 화면 골격.

   설계 결정 (안 A — 부모가 훅 호출, props로 전달):
   - 데이터/콜백은 WorkspacePage가 가진 훅(useWorkspaceMembers 등)에서 내려받음.
     이 컴포넌트는 훅을 직접 호출하지 않음.
   - 이유: WorkspacePage의 모달 7개(초대/삭제/나가기/항공편 등)가 데스크톱·모바일
     공용이라 페이지 레벨에 있어야 함. 훅을 여기서 다시 부르면 데이터·모달 상태가
     양쪽으로 갈라짐. useIsCompact로 한쪽만 렌더되더라도, 768px 경계를 넘나들 때
     언마운트→리마운트로 훅이 재실행(API 재요청)되는 문제도 있음.
   - props가 많아지는 단점은 "연관된 것끼리 객체로 묶어" 해소
     (member / flight / 추후 schedule / travelLog 그룹).

   레이아웃 (위 → 아래):
   - NavBar (variant="back")        — 뒤로가기 + 워크스페이스명 + 공유
   - MemberBar                      — 함께하는 사람 바 (탭하면 멤버 팝업)
   - 항공 일정 (CompactFlightSection) — 1단계 완성본, 실데이터 연결
   - 여행 일정 / 여행 기록 / 공유 앨범 — 이번 단계는 placeholder (자리만)
   - MobileFooter

   현재 단계 완성도:
   - 멤버 팝업: 실동작
   - 항공 섹션: 실동작 (1단계 산출물)
   - 그 외 섹션: placeholder. 모바일 디자인 이미지 확보 후 단계적으로 채움.
*/

/* ── props 그룹 타입 ── */

/** 멤버 관련 데이터/콜백 묶음 */
export interface CompactMemberProps {
  members: WorkspaceMember[];
  /** 멤버 초대 모달 열기 (WorkspacePage의 setShowInviteModal(true)) */
  onAddMember: () => void;
}

/** 항공편 관련 데이터/콜백 묶음 — CompactFlightSection으로 그대로 전달 */
export interface CompactFlightProps {
  flights: FlightInfo[];
  rawFlights: WorkspaceFlight[];
  onFlightClick: (flight: WorkspaceFlight) => void;
  onFlightDelete: (id: number, label: string) => void;
}

interface CompactWorkspaceViewProps {
  /** 워크스페이스 이름 (헤더 타이틀) */
  workspaceName: string;
  /** 뒤로가기 클릭 */
  onBack: () => void;
  /** 공유 클릭 */
  onShare?: () => void;
  /** 멤버 그룹 */
  member: CompactMemberProps;
  /** 항공편 그룹 */
  flight: CompactFlightProps;
}

/* ──────────────────────────────────────────
   섹션 placeholder
   ──────────────────────────────────────────
   아직 모바일 디자인이 확정되지 않은 섹션의 자리표시.
   점선 박스 + 섹션명 + "준비 중" 안내. 추후 실제 섹션으로 교체.
*/
function SectionPlaceholder({ title }: { title: string }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-pretendard text-body1 font-semibold text-gray-900 m-0">
        {title}
      </h2>
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-8 flex items-center justify-center">
        <p className="font-pretendard text-body4 text-gray-400 m-0">
          모바일 화면 준비 중입니다
        </p>
      </div>
    </section>
  );
}

export default function CompactWorkspaceView({
  workspaceName,
  onBack,
  onShare,
  member,
  flight,
}: CompactWorkspaceViewProps) {
  /* 멤버 목록 팝업 — 이 컴포넌트 로컬 상태 (페이지 모달과 무관) */
  const [isMemberPopupOpen, setIsMemberPopupOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── 헤더: NavBar back variant 재사용 ── */}
      <NavBar
        variant="back"
        title={workspaceName}
        onBack={onBack}
        onShare={onShare}
      />

      {/* ── 함께하는 사람 바 ── */}
      <MemberBar
        members={member.members}
        onOpen={() => setIsMemberPopupOpen(true)}
      />

      {/* ── 본문 섹션들 ── */}
      <main className="flex-1 flex flex-col gap-8 px-4 py-5">
        {/* 항공 일정 — 1단계 완성본, 실데이터 연결 */}
        <CompactFlightSection
          flights={flight.flights}
          rawFlights={flight.rawFlights}
          onFlightClick={flight.onFlightClick}
          onFlightDelete={flight.onFlightDelete}
        />

        {/* 아래 섹션들은 모바일 디자인 확보 후 단계적으로 교체 */}
        <SectionPlaceholder title="여행 일정" />
        <SectionPlaceholder title="여행 기록" />
        <SectionPlaceholder title="공유 앨범" />
      </main>

      {/* ── 푸터 ── */}
      <MobileFooter />

      {/* ── 멤버 목록 팝업 ── */}
      <MemberListPopup
        isOpen={isMemberPopupOpen}
        onClose={() => setIsMemberPopupOpen(false)}
        members={member.members}
      />
    </div>
  );
}
