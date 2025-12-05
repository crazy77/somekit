"use client";

import { useAtom } from "jotai";
import { analysisResultAtom, cameraVisibleAtom } from "~/stores/hormone";

export function ResultDisplay() {
  const [result] = useAtom(analysisResultAtom);
  const [, setCameraVisible] = useAtom(cameraVisibleAtom);

  if (!result) return null;

  const emoji =
    result.balance > 70
      ? "🔥🔥🔥"
      : result.balance > 50
        ? "🔥⚖️"
        : result.balance > 30
          ? "⚖️💧"
          : "💧💧💧";

  const message =
    result.balance > 70
      ? "테스토 우세!"
      : result.balance > 50
        ? "균형 좋음!"
        : result.balance > 30
          ? "조금 더!"
          : "에너지 충전!";

  const handleRetry = () => {
    setCameraVisible(true);
  };

  return (
    <div className="text-center">
      <div className="my-5 font-bold text-5xl">
        {emoji} {result.balance}%
      </div>
      <div className="my-2.5 text-2xl">{message}</div>
      <button
        className="rounded-full bg-gradient-to-r from-[#ff6b6b] to-[#feca57] px-6 py-3 font-bold text-base text-white transition-transform active:scale-95"
        onClick={handleRetry}
        type="button"
      >
        다시 측정
      </button>
    </div>
  );
}
