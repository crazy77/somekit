"use client";

// ROIS 영역 위치 (CameraCapture와 동일)
// control: { x: 50, y: 20, w: 40, h: 60 }
// testo: { x: 120, y: 20, w: 40, h: 60 }
// estro: { x: 190, y: 20, w: 40, h: 60 }
// gray: { x: 10, y: 10, w: 30, h: 30 }

interface KitDesignSimulatorProps {
  testoConcentration: number;
  estroConcentration: number;
}

export function KitDesignSimulator({
  testoConcentration,
  estroConcentration,
}: KitDesignSimulatorProps) {
  // 농도에 따른 색상 강도 계산 (면역크로마토그래피 스트립처럼)
  const getLineIntensity = (concentration: number) => {
    // 농도에 따라 선의 두께와 색상 강도 결정
    return Math.min(1, concentration);
  };

  const getTestoLineColor = (concentration: number) => {
    // 테스토스테론: 빨간색 계열, 농도가 높을수록 진함
    const intensity = Math.min(255, Math.round(concentration * 255));
    const opacity = getLineIntensity(concentration);
    return {
      r: intensity,
      g: Math.round(intensity * 0.2),
      b: Math.round(intensity * 0.1),
      opacity,
    };
  };

  const getEstroLineColor = (concentration: number) => {
    // 에스트로겐: 파란색 계열, 농도가 높을수록 진함
    const intensity = Math.min(255, Math.round(concentration * 255));
    const opacity = getLineIntensity(concentration);
    return {
      r: Math.round(intensity * 0.2),
      g: Math.round(intensity * 0.4),
      b: intensity,
      opacity,
    };
  };

  const controlColor = "#22C55E"; // 초록색 (제어선) - 항상 진하게
  const grayPatchColor = "#6B7280"; // 회색 (조명 보정)
  const whitePatchColor = "#FFFFFF"; // 흰색 (조명 보정)

  // 검사선 색상 및 강도
  const testoLine = getTestoLineColor(testoConcentration);
  const estroLine = getEstroLineColor(estroConcentration);

  // 키트 크기 (면역크로마토그래피 스트립 비율 - 세로로 긴 형태)
  const kitWidth = 300;
  const kitHeight = 150;

  // 각 영역의 위치 (ROIS 기반)
  const controlX = 50;
  const testoX = 120;
  const estroX = 190;
  const lineY = 20;
  const lineHeight = 60;
  const lineWidth = 40;

  return (
    <div className="my-5 rounded-xl bg-white p-5 shadow-lg">
      <h4 className="mb-3 text-center font-bold text-sm">면역크로마토그래피 스트립 시뮬레이션</h4>
      <div className="mb-3 text-center text-gray-600 text-xs">
        각 선의 색상 강도로 농도를 비교합니다
      </div>

      {/* 키트 모형 - 면역크로마토그래피 스트립 형태 */}
      <div
        className="relative mx-auto overflow-hidden rounded-lg border-2 border-gray-300 bg-white shadow-md"
        style={{ width: kitWidth, height: kitHeight }}
      >
        <svg
          aria-label="면역크로마토그래피 스트립 디자인 시뮬레이션"
          className="w-full"
          height={kitHeight}
          viewBox="0 0 300 150"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>면역크로마토그래피 스트립 디자인 시뮬레이션</title>
          {/* 배경 (흰색 니트로셀룰로스 막 느낌) */}
          <rect fill="#FEFEFE" height="150" width="300" x="0" y="0" />

          {/* 코너 검출용 검은색 마커 */}
          <rect fill="#000000" height="6" width="6" x="2" y="2" />
          <rect fill="#000000" height="6" width="6" x="292" y="2" />
          <rect fill="#000000" height="6" width="6" x="2" y="142" />
          <rect fill="#000000" height="6" width="6" x="292" y="142" />

          {/* 좌측 보정 영역 */}
          {/* 조명 보정용 흰색 패치 */}
          <rect
            fill={whitePatchColor}
            height="20"
            stroke="#D1D5DB"
            strokeWidth="0.5"
            width="20"
            x="10"
            y="10"
          />
          <text fill="#9CA3AF" fontSize="6" fontWeight="bold" x="20" y="22">
            W
          </text>

          {/* 조명 보정용 회색 패치 */}
          <rect
            fill={grayPatchColor}
            height="20"
            stroke="#D1D5DB"
            strokeWidth="0.5"
            width="20"
            x="10"
            y="35"
          />
          <text fill="#FFFFFF" fontSize="6" fontWeight="bold" x="20" y="47">
            G
          </text>

          {/* 색상 보정용 컬러 패치 (RGB) */}
          <rect
            fill="#EF4444"
            height="10"
            stroke="#D1D5DB"
            strokeWidth="0.5"
            width="10"
            x="10"
            y="60"
          />
          <rect
            fill="#22C55E"
            height="10"
            stroke="#D1D5DB"
            strokeWidth="0.5"
            width="10"
            x="22"
            y="60"
          />
          <rect
            fill="#3B82F6"
            height="10"
            stroke="#D1D5DB"
            strokeWidth="0.5"
            width="10"
            x="34"
            y="60"
          />

          {/* 측정 영역 - 면역크로마토그래피 라인 형태 */}
          {/* 제어선 (Control Line) - 항상 진하게 표시 */}
          <rect
            fill={controlColor}
            height={lineHeight}
            opacity="1"
            rx="2"
            width="4"
            x={controlX + lineWidth / 2 - 2}
            y={lineY}
          />
          {/* 제어선 라벨 */}
          <text
            fill="#22C55E"
            fontSize="9"
            fontWeight="bold"
            textAnchor="middle"
            x={controlX + lineWidth / 2}
            y={lineY + lineHeight + 12}
          >
            C
          </text>

          {/* 테스토스테론 검사선 (Test Line) - 농도에 따라 색상 강도만 변화 */}
          {testoConcentration > 0 && (
            <rect
              fill={`rgb(${testoLine.r}, ${testoLine.g}, ${testoLine.b})`}
              height={lineHeight}
              opacity={testoLine.opacity}
              rx="2"
              width="4"
              x={testoX + lineWidth / 2 - 2}
              y={lineY}
            />
          )}
          {/* 테스토스테론 라벨 */}
          <text
            fill={testoConcentration > 0.1 ? "#DC2626" : "#9CA3AF"}
            fontSize="9"
            fontWeight="bold"
            textAnchor="middle"
            x={testoX + lineWidth / 2}
            y={lineY + lineHeight + 12}
          >
            T
          </text>

          {/* 에스트로겐 검사선 (Test Line) - 농도에 따라 색상 강도만 변화 */}
          {estroConcentration > 0 && (
            <rect
              fill={`rgb(${estroLine.r}, ${estroLine.g}, ${estroLine.b})`}
              height={lineHeight}
              opacity={estroLine.opacity}
              rx="2"
              width="4"
              x={estroX + lineWidth / 2 - 2}
              y={lineY}
            />
          )}
          {/* 에스트로겐 라벨 */}
          <text
            fill={estroConcentration > 0.1 ? "#2563EB" : "#9CA3AF"}
            fontSize="9"
            fontWeight="bold"
            textAnchor="middle"
            x={estroX + lineWidth / 2}
            y={lineY + lineHeight + 12}
          >
            E
          </text>

          {/* 영역 구분선 (가이드) */}
          <line
            stroke="#E5E7EB"
            strokeDasharray="2,2"
            strokeWidth="0.5"
            x1={controlX}
            x2={controlX}
            y1="15"
            y2="95"
          />
          <line
            stroke="#E5E7EB"
            strokeDasharray="2,2"
            strokeWidth="0.5"
            x1={testoX}
            x2={testoX}
            y1="15"
            y2="95"
          />
          <line
            stroke="#E5E7EB"
            strokeDasharray="2,2"
            strokeWidth="0.5"
            x1={estroX}
            x2={estroX}
            y1="15"
            y2="95"
          />
          <line
            stroke="#E5E7EB"
            strokeDasharray="2,2"
            strokeWidth="0.5"
            x1={controlX + lineWidth}
            x2={controlX + lineWidth}
            y1="15"
            y2="95"
          />
          <line
            stroke="#E5E7EB"
            strokeDasharray="2,2"
            strokeWidth="0.5"
            x1={testoX + lineWidth}
            x2={testoX + lineWidth}
            y1="15"
            y2="95"
          />
          <line
            stroke="#E5E7EB"
            strokeDasharray="2,2"
            strokeWidth="0.5"
            x1={estroX + lineWidth}
            x2={estroX + lineWidth}
            y1="15"
            y2="95"
          />

          {/* 농도 표시 바 (하단) */}
          <rect fill="#F3F4F6" height="20" rx="2" width="280" x="10" y="110" />
          {testoConcentration > 0 && (
            <rect
              fill={`rgb(${testoLine.r}, ${testoLine.g}, ${testoLine.b})`}
              height="16"
              opacity={testoLine.opacity}
              rx="2"
              width={testoConcentration * 130}
              x="15"
              y="113"
            />
          )}
          {estroConcentration > 0 && (
            <rect
              fill={`rgb(${estroLine.r}, ${estroLine.g}, ${estroLine.b})`}
              height="16"
              opacity={estroLine.opacity}
              rx="2"
              width={estroConcentration * 130}
              x="145"
              y="113"
            />
          )}
          <text fill="#6B7280" fontSize="7" x="15" y="125">
            T 농도
          </text>
          <text fill="#6B7280" fontSize="7" x="145" y="125">
            E 농도
          </text>
        </svg>
      </div>

      {/* 설명 */}
      <div className="mt-4 rounded-lg bg-blue-50 p-3 text-xs">
        <div className="mb-2 font-bold text-blue-900">면역크로마토그래피 스트립 설명:</div>
        <ul className="list-inside list-disc space-y-1 text-blue-800">
          <li>
            <strong>제어선 (C)</strong>: 항상 진하게 나타나며, 테스트가 정상 작동함을 확인
          </li>
          <li>
            <strong>테스토스테론 검사선 (T)</strong>: 농도에 따라 선의 색상 강도만 변화 (두께/높이
            고정)
          </li>
          <li>
            <strong>에스트로겐 검사선 (E)</strong>: 농도에 따라 선의 색상 강도만 변화 (두께/높이
            고정)
          </li>
          <li>
            <strong>반정량 분석</strong>: 각 검사선의 색상 강도를 비교하여 농도를 측정
          </li>
        </ul>
      </div>

      {/* 레전드 */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-3 w-8 rounded border border-gray-300 bg-green-500" />
          <span>C: 제어선 (항상 표시)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-8 rounded border border-gray-300 bg-red-500" />
          <span>T: 테스토스테론 검사선</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-8 rounded border border-gray-300 bg-blue-500" />
          <span>E: 에스트로겐 검사선</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-8 rounded border-2 border-black bg-white" />
          <span>코너: 검출 마커</span>
        </div>
      </div>
    </div>
  );
}
