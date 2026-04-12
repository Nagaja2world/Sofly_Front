import { useNavigate } from "react-router-dom";
import SearchBar from "@/components/SearchBar";
import WorkspaceCard from "@/components/profilePage/WorkspaceCard";
import Button from "@/components/common/Button";
import Header from "@/components/common/Header";

import profileHeroSvg from "@/assets/profile_hero.svg";
import GroupIcon from "@/assets/group.svg?react";
import PlusIcon from "@/assets/plus.svg?react";

/* ── 워크스페이스 데이터 타입 ── */
export interface WorkspaceData {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  memberCount?: number;
  imageUrl?: string;
}

interface ProfilePageProps {
  /** 사용자 이름 (카카오/구글 로그인 시 받아온 닉네임) */
  userName?: string;
  /** 워크스페이스 목록 */
  workspaces?: WorkspaceData[];
  /** 새 워크스페이스 생성 콜백 */
  onCreateWorkspace?: () => void;
}

export default function ProfilePage({
  userName = "여행자",
  workspaces = [],
  onCreateWorkspace,
}: ProfilePageProps) {
  const navigate = useNavigate();

  const handleSearch = (params: { tripType: string; directOnly: boolean }) => {
    // TODO: 검색 결과 페이지 이동
    console.log("search:", params);
  };

  const handleCardClick = (id: string) => {
    navigate(`/workspace/${id}`);
  };

  const handleCreateWorkspace = () => {
    if (onCreateWorkspace) {
      onCreateWorkspace();
    } else {
      navigate("/workspace/new");
    }
  };

  const handleConquestMap = () => {
    navigate("/conquest-map");
  };

  return (
    <>
      {/* ══════════════════════════════════════════
          모바일 (md 미만)
          ══════════════════════════════════════════ */}
      <div className="md:hidden px-4 py-6">
        {/* TODO: 모바일 프로필 컴포넌트 */}
        <p className="text-gray-500 text-center text-body3">
          모바일 화면은 준비 중입니다.
        </p>
      </div>

      {/* ══════════════════════════════════════════
          데스크톱 (md 이상)
          ══════════════════════════════════════════ */}
      <div className="hidden md:block">
        {/* ── ① Hero 이미지: Header 아래로 끌어올려 겹침 ── */}
        {/* Header 높이(h-20 = 80px)만큼 올려서 Header 뒤에 깔리도록 */}
        <div className="w-full h-[374px] overflow-hidden">
          <img
            src={profileHeroSvg}
            alt="Profile Hero"
            className="w-full h-full object-cover block"
          />
        </div>

        {/* ── ② Header (login 상태, 흰 배경) ── */}
        <div className="-mt-[374px] w-full bg-white border-b border-gray-300 relative z-20">
          <div className="max-w-[1200px] w-full mx-auto px-4">
            <Header variant="login" />
          </div>
        </div>

        {/* ── Welcome 메시지: 음수 마진으로 Hero에 겹침 ── */}
        <div className="mt-[60px] z-10 px-4 relative">
          <div className="max-w-[1200px] w-full mx-auto flex items-center justify-between">
            {/* 왼쪽: 프로필 아이콘 + 인사말 */}
            <div className="flex items-center gap-4">
              <GroupIcon className="w-[64px] h-[64px] shrink-0" />
              <div>
                <h1 className="font-montserrat text-title2 font-semibold text-gray-900 m-0">
                  Welcome, Traveler!
                </h1>
                <p className="font-pretendard text-body2 text-gray-600 mt-4">
                  {userName}님, 오늘은 어디로 떠나볼까요?
                </p>
              </div>
            </div>

            {/* 오른쪽: Conquest Map 버튼 */}
            <Button btnType="outlined" onClick={handleConquestMap}>
              Conquest Map
            </Button>
          </div>
        </div>

        {/* ── 항공편 검색 ── */}
        <div className="mt-[40px] z-10 px-4 relative">
          <div className="max-w-[1200px] w-full mx-auto">
            <h2 className="font-pretendard text-title2 font-semibold text-gray-900 mb-6">
              항공편 검색
            </h2>
            <SearchBar onSearch={handleSearch} />
          </div>
        </div>

        {/* ── 워크스페이스 ── */}
        <div className="px-4">
          <div className="max-w-[1200px] w-full mx-auto pt-20 pb-20">
            {/* 섹션 헤더 */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-pretendard text-title2 font-semibold text-gray-900 m-0">
                워크스페이스
              </h2>
              <Button
                btnType="text"
                icon={<PlusIcon />}
                onClick={handleCreateWorkspace}
              >
                New Workspace
              </Button>
            </div>

            {/* 카드 그리드 또는 빈 상태 */}
            {workspaces.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {workspaces.map((ws) => (
                  <WorkspaceCard
                    key={ws.id}
                    id={ws.id}
                    name={ws.name}
                    startDate={ws.startDate}
                    endDate={ws.endDate}
                    memberCount={ws.memberCount}
                    imageUrl={ws.imageUrl}
                    onClick={handleCardClick}
                  />
                ))}
              </div>
            ) : (
              /* 빈 상태 */
              <div
                className={[
                  "flex flex-col items-center justify-center",
                  "py-20 rounded-xl border-2 border-dashed border-gray-300",
                  "bg-gray-100/50",
                ].join(" ")}
              >
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="mb-4"
                >
                  <path
                    d="M24 10V38"
                    stroke="#C4C4C4"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10 24H38"
                    stroke="#C4C4C4"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
                <p className="font-pretendard text-body2 text-gray-500 mb-1">
                  아직 워크스페이스가 없어요
                </p>
                <p className="font-pretendard text-body3 text-gray-400 mb-5">
                  새로운 여행을 계획하고 함께 떠나보세요!
                </p>
                <Button btnType="solid" onClick={handleCreateWorkspace}>
                  첫 워크스페이스 만들기
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
