import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAuthStore from "@/store/useAuthStore";

/**
 * /auth/callback
 *
 * 소셜 로그인 성공 후 백엔드가 리다이렉트하는 페이지
 * URL 파라미터에서 토큰을 파싱하여 저장 후 /profile로 이동
 *
 * 성공: /auth/callback?accessToken=xxx&refreshToken=xxx
 * 실패: /auth/callback?error=에러메시지
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setTokens, fetchUserProfile } = useAuthStore();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const error = searchParams.get("error");

    /* 로그인 실패 */
    if (error) {
      console.error("로그인 실패:", error);
      alert(`로그인에 실패했습니다: ${error}`);
      navigate("/", { replace: true });
      return;
    }

    /* 토큰이 없는 경우 */
    if (!accessToken || !refreshToken) {
      console.error("토큰이 없습니다");
      navigate("/", { replace: true });
      return;
    }

    /* 로그인 성공: 토큰 저장 → 프로필 조회 → 이동 */
    const handleLogin = async () => {
      setTokens(accessToken, refreshToken);
      //   await fetchUserProfile();
      //   navigate("/profile", { replace: true });
      try {
        await fetchUserProfile();
        navigate("/profile", { replace: true });
      } catch {
        console.error("프로필 조회 실패, 로그인 취소");
        useAuthStore.getState().logout();
        alert("로그인 처리 중 오류가 발생했습니다. 다시 시도해 주세요.");
        navigate("/", { replace: true });
      }
    };

    handleLogin();
  }, [searchParams, navigate, setTokens, fetchUserProfile]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <p className="font-pretendard text-body2 text-gray-600">로그인 중...</p>
    </div>
  );
}
