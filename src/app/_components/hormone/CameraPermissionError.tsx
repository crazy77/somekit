"use client";

import { useState } from "react";

interface CameraPermissionErrorProps {
  onRetry: () => void;
  onClose: () => void;
  errorMessage?: string;
  isOverlayError?: boolean;
}

export function CameraPermissionError({
  onRetry,
  onClose,
  errorMessage = "다른 앱의 대화창이나 오버레이를 모두 닫은 다음 다시 시도해 보세요.",
  isOverlayError = false,
}: CameraPermissionErrorProps) {
  const [showSteps, setShowSteps] = useState(false);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-gray-800 p-6 text-white shadow-xl">
        <div className="mb-4 text-center">
          <div className="mb-3 text-4xl">📷</div>
          <h3 className="mb-2 font-bold text-xl">
            {isOverlayError ? "오버레이 문제 감지" : "카메라 사용 불가"}
          </h3>
          <p className="text-gray-300 text-sm">{errorMessage}</p>
        </div>

        {isOverlayError && (
          <div className="mt-4 mb-4 rounded-lg bg-gray-700/50 p-3">
            <button
              className="mb-2 w-full text-left font-semibold text-sm text-teal-400"
              onClick={() => setShowSteps(!showSteps)}
              type="button"
            >
              {showSteps ? "▼" : "▶"} 해결 방법 보기
            </button>
            {showSteps && (
              <ol className="list-inside list-decimal space-y-2 text-left text-gray-300 text-xs">
                <li>다른 앱의 알림이나 팝업을 모두 닫기</li>
                <li>브라우저의 다른 탭에서 열린 다이얼로그 확인</li>
                <li>모바일: 최근 앱 목록에서 다른 앱 종료</li>
                <li>페이지 새로고침 후 다시 시도</li>
              </ol>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <button
            className="w-full rounded-lg bg-teal-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-teal-600"
            onClick={onRetry}
            type="button"
          >
            다시 시도하기
          </button>
          {isOverlayError && (
            <button
              className="w-full rounded-lg border border-teal-500 bg-gray-800 px-4 py-3 font-semibold text-teal-400 transition-colors hover:bg-gray-700"
              onClick={handleRefresh}
              type="button"
            >
              페이지 새로고침
            </button>
          )}
          <button
            className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 font-semibold text-white transition-colors hover:bg-gray-600"
            onClick={onClose}
            type="button"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
