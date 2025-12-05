"use client";

import { useAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { useState } from "react";
import { type AnalysisResult, analysisResultAtom, statusMessageAtom } from "~/stores/hormone";
import { CameraCapture } from "./CameraCapture";
import { ResultDisplay } from "./ResultDisplay";
import { StatusDisplay } from "./StatusDisplay";
import { TestPanel } from "./TestPanel";

export function HormoneCheck() {
  useHydrateAtoms([[analysisResultAtom, null]]);

  const [result, setResult] = useAtom(analysisResultAtom);
  const [, setStatus] = useAtom(statusMessageAtom);

  const handleCapture = (analysisResult: AnalysisResult | null) => {
    if (analysisResult) {
      setResult(analysisResult);
      setStatus({ text: "", type: null });
    }
  };

  const [showCamera, setShowCamera] = useState(false);

  return (
    <div className="container mx-auto max-w-md rounded-3xl bg-white p-10 text-center shadow-[0_20px_40px_rgba(0,0,0,0.1)]">
      <h1 className="mb-2 font-bold text-2xl">🔥💧 호르몬 체크</h1>
      <p className="mb-5 text-gray-600">면역크로마토그래피 스트립을 촬영하여 비율을 측정하세요</p>

      {!result && !showCamera && (
        <>
          <TestPanel />
          <button
            className="mt-5 w-full rounded-full bg-gradient-to-r from-[#ff6b6b] to-[#feca57] px-6 py-4 font-bold text-base text-white shadow-lg transition-transform active:scale-95"
            onClick={() => setShowCamera(true)}
            type="button"
          >
            📸 스트립 촬영하기
          </button>
        </>
      )}

      {showCamera && !result && (
        <CameraCapture
          onCapture={(analysisResult) => {
            if (analysisResult) {
              handleCapture(analysisResult);
            }
          }}
        />
      )}

      <StatusDisplay />
      {result && (
        <ResultDisplay
          onRetry={() => {
            setResult(null);
            setShowCamera(false);
          }}
        />
      )}
    </div>
  );
}
