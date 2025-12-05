"use client";

import { useAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
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

  return (
    <div className="container mx-auto max-w-md rounded-3xl bg-white p-10 text-center shadow-[0_20px_40px_rgba(0,0,0,0.1)]">
      <h1 className="mb-2 font-bold text-2xl">🔥💧 호르몬 체크</h1>
      <p className="mb-5 text-gray-600">타액 스트립을 카메라에 맞춰주세요!</p>

      {!result && (
        <>
          <TestPanel />
          <CameraCapture onCapture={handleCapture} />
        </>
      )}

      <StatusDisplay />
      {result && <ResultDisplay />}
    </div>
  );
}
