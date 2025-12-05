"use client";

import { useAtom } from "jotai";
import { useCallback, useState } from "react";
import { type CalibrationData, calibrationDataAtom, testModeAtom } from "~/stores/hormone";
import { KitDesignSimulator } from "./KitDesignSimulator";

export function TestPanel() {
  const [testMode, setTestMode] = useAtom(testModeAtom);
  const [calibrationData, setCalibrationData] = useAtom(calibrationDataAtom);
  const [testoConcentration, setTestoConcentration] = useState(0.5);
  const [estroConcentration, setEstroConcentration] = useState(0.3);

  const handleTest = useCallback(() => {
    const simulatedResult = {
      balance: Math.round((testoConcentration / (testoConcentration + estroConcentration)) * 100),
      tNorm: testoConcentration,
      eNorm: estroConcentration,
      rawT: testoConcentration,
      rawE: estroConcentration,
    };

    const newCalibration: CalibrationData = {
      type: testoConcentration > estroConcentration ? "T" : "E",
      level:
        testoConcentration > 0.6 || estroConcentration > 0.5
          ? "high"
          : testoConcentration > 0.3 || estroConcentration > 0.2
            ? "med"
            : "low",
      knownT: testoConcentration,
      knownE: estroConcentration,
      measured: simulatedResult.balance,
    };

    setCalibrationData([...calibrationData, newCalibration]);
  }, [testoConcentration, estroConcentration, calibrationData, setCalibrationData]);

  if (!testMode) {
    return (
      <div className="mb-5">
        <button
          className="rounded-full bg-gradient-to-r from-[#28a745] to-[#20c997] px-4 py-2 font-bold text-sm text-white transition-transform active:scale-95"
          onClick={() => setTestMode(true)}
          type="button"
        >
          🧪 농도 테스트
        </button>
      </div>
    );
  }

  return (
    <div className="my-5 rounded-xl bg-[#f8f9fa] p-5">
      <h3 className="mb-2 font-bold text-lg">🧪 농도별 테스트</h3>
      <p className="mb-4 text-gray-600 text-sm">슬라이더로 농도를 조절하여 테스트</p>

      {/* 키트 디자인 시뮬레이션 */}
      <KitDesignSimulator
        estroConcentration={estroConcentration}
        testoConcentration={testoConcentration}
      />

      {/* 농도 조절 슬라이더 */}
      <div className="mt-5 space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="font-semibold text-gray-700 text-sm" htmlFor="testo-slider">
              테스토스테론 농도
            </label>
            <span className="font-bold text-red-600">{testoConcentration.toFixed(2)}</span>
          </div>
          <input
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-red-600"
            id="testo-slider"
            max="1"
            min="0"
            onChange={(e) => setTestoConcentration(Number.parseFloat(e.target.value))}
            step="0.01"
            type="range"
            value={testoConcentration}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="font-semibold text-gray-700 text-sm" htmlFor="estro-slider">
              에스트로겐 농도
            </label>
            <span className="font-bold text-blue-600">{estroConcentration.toFixed(2)}</span>
          </div>
          <input
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600"
            id="estro-slider"
            max="1"
            min="0"
            onChange={(e) => setEstroConcentration(Number.parseFloat(e.target.value))}
            step="0.01"
            type="range"
            value={estroConcentration}
          />
        </div>

        <button
          className="w-full rounded-lg bg-gradient-to-r from-[#28a745] to-[#20c997] px-4 py-2 font-bold text-sm text-white transition-transform active:scale-95"
          onClick={handleTest}
          type="button"
        >
          현재 농도로 테스트 실행
        </button>
      </div>
      {calibrationData.length > 0 && (
        <div className="mt-5">
          {calibrationData.map((data) => {
            const key = `${data.type}-${data.level}-${data.knownT}-${data.knownE}`;
            return (
              <div
                className="flex justify-between border-[#dee2e6] border-b py-2 text-sm"
                key={key}
              >
                <span>
                  {data.type} {data.level} ({data.knownT.toFixed(2)}:{data.knownE.toFixed(2)})
                </span>
                <span className="font-bold text-[#28a745]">{data.measured}% 🔥</span>
              </div>
            );
          })}
        </div>
      )}
      <button
        className="mt-4 w-full rounded-full bg-gradient-to-r from-[#ff6b6b] to-[#feca57] px-4 py-2 font-bold text-sm text-white transition-transform active:scale-95"
        onClick={() => {
          setTestMode(false);
          setCalibrationData([]);
          setTestoConcentration(0.5);
          setEstroConcentration(0.3);
        }}
        type="button"
      >
        실제 촬영
      </button>
    </div>
  );
}
