import { atom } from "jotai";

export type HormoneType = "T" | "E";
export type ConcentrationLevel = "low" | "med" | "high";

export interface AnalysisResult {
  balance: number;
  tNorm: number;
  eNorm: number;
  rawT: number;
  rawE: number;
}

export interface CalibrationData {
  type: HormoneType;
  level: ConcentrationLevel;
  knownT: number;
  knownE: number;
  measured: number;
}

// 카메라 스트림 상태
export const cameraStreamAtom = atom<MediaStream | null>(null);

// 분석 결과 상태
export const analysisResultAtom = atom<AnalysisResult | null>(null);

// 테스트 모드 상태
export const testModeAtom = atom<boolean>(false);

// 캘리브레이션 데이터 상태
export const calibrationDataAtom = atom<CalibrationData[]>([]);

// 카메라 컨테이너 표시 상태
export const cameraVisibleAtom = atom<boolean>(false);

// 상태 메시지
export const statusMessageAtom = atom<{
  text: string;
  type: "loading" | "success" | "error" | null;
}>({ text: "", type: null });
