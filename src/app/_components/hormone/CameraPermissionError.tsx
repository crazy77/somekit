"use client";

interface CameraPermissionErrorProps {
  onRetry: () => void;
  onClose: () => void;
}

export function CameraPermissionError({ onRetry, onClose }: CameraPermissionErrorProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-gray-800 p-6 text-white shadow-xl">
        <div className="mb-4 text-center">
          <div className="mb-3 text-4xl">📷</div>
          <h3 className="mb-2 font-bold text-xl">이 사이트에서는 권한을 요청할 수 없음</h3>
          <p className="text-gray-300 text-sm">
            다른 앱의 대화창이나 오버레이를 모두 닫은 다음 다시 시도해 보세요.
          </p>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            className="flex-1 rounded-lg bg-teal-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-teal-600"
            onClick={onRetry}
            type="button"
          >
            다시 시도하기
          </button>
          <button
            className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 font-semibold text-white transition-colors hover:bg-gray-600"
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
