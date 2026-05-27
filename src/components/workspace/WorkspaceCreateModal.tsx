import { useState } from "react";
import { createPortal } from "react-dom";

const COUNTRIES = [
  { code: 'JP', name: '일본' },
  { code: 'TH', name: '태국' },
  { code: 'VN', name: '베트남' },
  { code: 'TW', name: '대만' },
  { code: 'SG', name: '싱가포르' },
  { code: 'HK', name: '홍콩' },
  { code: 'CN', name: '중국' },
  { code: 'ID', name: '인도네시아' },
  { code: 'PH', name: '필리핀' },
  { code: 'MY', name: '말레이시아' },
  { code: 'FR', name: '프랑스' },
  { code: 'IT', name: '이탈리아' },
  { code: 'ES', name: '스페인' },
  { code: 'DE', name: '독일' },
  { code: 'GB', name: '영국' },
  { code: 'GR', name: '그리스' },
  { code: 'PT', name: '포르투갈' },
  { code: 'TR', name: '터키' },
  { code: 'US', name: '미국' },
  { code: 'CA', name: '캐나다' },
  { code: 'AU', name: '호주' },
  { code: 'KR', name: '대한민국' },
];

export interface WorkspaceCreatePayload {
  title: string;
  destination: string;
  countryCode: string;
  startDate: string;
  endDate: string;
}

interface Props {
  isOpen: boolean;
  isCreating: boolean;
  onClose: () => void;
  onCreate: (payload: WorkspaceCreatePayload) => void;
}

function today() {
  return new Date().toISOString().split('T')[0];
}
function nextWeek() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

export default function WorkspaceCreateModal({ isOpen, isCreating, onClose, onCreate }: Props) {
  const [title, setTitle] = useState('새 워크스페이스');
  const [destination, setDestination] = useState('');
  const [countryCode, setCountryCode] = useState('JP');
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(nextWeek());

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !destination.trim()) return;
    onCreate({ title: title.trim(), destination: destination.trim(), countryCode, startDate, endDate });
  };

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget && !isCreating) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[440px] overflow-hidden animate-[popupFadeIn_0.2s_ease-out]">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-pretendard text-body1 font-semibold text-gray-900 m-0">새 워크스페이스</h2>
          <button type="button" onClick={onClose} disabled={isCreating}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 bg-transparent border-none cursor-pointer transition-colors disabled:opacity-40">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {/* 워크스페이스 이름 */}
          <div className="flex flex-col gap-1.5">
            <label className="font-pretendard text-body4 font-medium text-gray-700">워크스페이스 이름</label>
            <input
              value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 도쿄 3박 4일"
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 font-pretendard text-body3 text-gray-900 outline-none focus:border-gray-600 transition-colors"
            />
          </div>

          {/* 목적지 + 국가 */}
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="font-pretendard text-body4 font-medium text-gray-700">목적지</label>
              <input
                value={destination} onChange={(e) => setDestination(e.target.value)}
                placeholder="예: 도쿄"
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 font-pretendard text-body3 text-gray-900 outline-none focus:border-gray-600 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5 w-[140px]">
              <label className="font-pretendard text-body4 font-medium text-gray-700">국가</label>
              <select
                value={countryCode} onChange={(e) => setCountryCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 font-pretendard text-body3 text-gray-900 outline-none focus:border-gray-600 transition-colors bg-white"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 날짜 */}
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="font-pretendard text-body4 font-medium text-gray-700">출발일</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 font-pretendard text-body3 text-gray-900 outline-none focus:border-gray-600 transition-colors" />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="font-pretendard text-body4 font-medium text-gray-700">귀국일</label>
              <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 font-pretendard text-body3 text-gray-900 outline-none focus:border-gray-600 transition-colors" />
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} disabled={isCreating}
              className="flex-1 py-2.5 rounded-lg font-pretendard text-body3 font-medium text-gray-600 border border-gray-300 bg-white hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-40">
              취소
            </button>
            <button type="submit" disabled={isCreating || !title.trim() || !destination.trim()}
              className="flex-1 py-2.5 rounded-lg font-pretendard text-body3 font-semibold text-gray-900 bg-primary hover:brightness-95 transition-all cursor-pointer disabled:opacity-50">
              {isCreating ? '생성 중...' : '만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
