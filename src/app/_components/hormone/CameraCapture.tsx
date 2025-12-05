"use client";

import { useAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type AnalysisResult,
  cameraStreamAtom,
  cameraVisibleAtom,
  statusMessageAtom,
} from "~/stores/hormone";
import { CameraPermissionError } from "./CameraPermissionError";

const ROIS = {
  control: { x: 50, y: 20, w: 40, h: 60 },
  testo: { x: 120, y: 20, w: 40, h: 60 },
  estro: { x: 190, y: 20, w: 40, h: 60 },
  gray: { x: 10, y: 10, w: 30, h: 30 },
};

interface CameraCaptureProps {
  onCapture: (result: AnalysisResult | null) => void;
  onClose?: () => void;
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const [stream, setStream] = useAtom(cameraStreamAtom);
  const [cameraVisible, setCameraVisible] = useAtom(cameraVisibleAtom);
  const [, setStatus] = useAtom(statusMessageAtom);
  const [showPermissionError, setShowPermissionError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isOverlayError, setIsOverlayError] = useState(false);

  // 에러 타입별 메시지 생성 함수
  const getErrorMessage = useCallback(
    (error: unknown): { message: string; showModal: boolean; isOverlay?: boolean } => {
      if (error instanceof Error) {
        const errorName = error.name;
        const errorMessageText = error.message;

        console.log("Error name:", errorName);
        console.log("Error message:", errorMessageText);

        // 권한 거부
        if (errorName === "NotAllowedError" || errorName === "PermissionDeniedError") {
          return {
            message: "카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.",
            showModal: true,
            isOverlay: false,
          };
        }
        // 다른 앱이 카메라 사용 중
        if (errorName === "NotReadableError" || errorName === "TrackStartError") {
          return {
            message: "카메라가 다른 앱에서 사용 중이거나 접근할 수 없습니다.",
            showModal: true,
            isOverlay: false,
          };
        }
        // 오버레이 문제 (일부 브라우저)
        if (
          errorMessageText.includes("권한을 요청할 수 없음") ||
          errorMessageText.includes("cannot request permission") ||
          errorMessageText.includes("overlay") ||
          errorMessageText.includes("다른 앱")
        ) {
          return {
            message: "다른 앱의 대화창이나 오버레이를 모두 닫은 다음 다시 시도해 보세요.",
            showModal: true,
            isOverlay: true,
          };
        }
        // 기타 에러
        return {
          message: `카메라 오류: ${errorMessageText}`,
          showModal: true,
          isOverlay: false,
        };
      }

      if (typeof error === "object" && error !== null && "name" in error) {
        const errorName = String(error.name);
        if (errorName === "NotAllowedError") {
          return {
            message: "카메라 권한이 거부되었습니다.",
            showModal: true,
            isOverlay: false,
          };
        }
      }

      return {
        message: "카메라를 사용할 수 없습니다.",
        showModal: true,
        isOverlay: false,
      };
    },
    []
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const guideCanvasRef = useRef<HTMLCanvasElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const onCloseRef = useRef(onClose);
  const [rafId, setRafId] = useState<number | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!analysisCanvasRef.current) {
      analysisCanvasRef.current = document.createElement("canvas");
    }
  }, []);

  // 색상별 강도 계산 함수
  const calculateColorIntensity = (
    r: number,
    g: number,
    b: number,
    targetColor: "red" | "blue" | "green"
  ): number => {
    if (targetColor === "red") {
      return r - (g * 0.2 + b * 0.1);
    }
    if (targetColor === "blue") {
      return b - (r * 0.2 + g * 0.4);
    }
    return g - (r * 0.3 + b * 0.3);
  };

  // 면역크로마토그래피 라인의 색상 강도 분석
  const getLineColorIntensity = (
    imageData: ImageData,
    targetColor: "red" | "blue" | "green"
  ): number => {
    let totalIntensity = 0;
    let pixelCount = 0;

    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      if (r === undefined || g === undefined || b === undefined) continue;

      const intensity = calculateColorIntensity(r, g, b, targetColor);
      if (intensity > 0) {
        totalIntensity += intensity;
        pixelCount++;
      }
    }

    return pixelCount > 0 ? Math.min(1, totalIntensity / pixelCount / 255) : 0;
  };

  // 조명 보정을 위한 흰색/회색 패치 분석
  const getLightingCorrection = (imageData: ImageData): number => {
    let totalBrightness = 0;
    let pixelCount = 0;

    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      if (r === undefined || g === undefined || b === undefined) continue;

      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;
      pixelCount++;
    }

    return pixelCount > 0 ? totalBrightness / pixelCount / 255 : 1;
  };

  const analyzeStrip = (): AnalysisResult => {
    const video = videoRef.current;
    const canvas = analysisCanvasRef.current;
    if (!video || !canvas) {
      throw new Error("Video or canvas not available");
    }

    // 실제 비디오 크기에 맞춰 캔버스 크기 조정
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas context not available");
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 비디오 크기에 비례하여 ROIS 영역 조정
    const scaleX = canvas.width / 300;
    const scaleY = canvas.height / 150;

    const adjustedROIS = {
      control: {
        x: Math.round(ROIS.control.x * scaleX),
        y: Math.round(ROIS.control.y * scaleY),
        w: Math.round(ROIS.control.w * scaleX),
        h: Math.round(ROIS.control.h * scaleY),
      },
      testo: {
        x: Math.round(ROIS.testo.x * scaleX),
        y: Math.round(ROIS.testo.y * scaleY),
        w: Math.round(ROIS.testo.w * scaleX),
        h: Math.round(ROIS.testo.h * scaleY),
      },
      estro: {
        x: Math.round(ROIS.estro.x * scaleX),
        y: Math.round(ROIS.estro.y * scaleY),
        w: Math.round(ROIS.estro.w * scaleX),
        h: Math.round(ROIS.estro.h * scaleY),
      },
      gray: {
        x: Math.round(ROIS.gray.x * scaleX),
        y: Math.round(ROIS.gray.y * scaleY),
        w: Math.round(ROIS.gray.w * scaleX),
        h: Math.round(ROIS.gray.h * scaleY),
      },
    };

    // 각 영역의 이미지 데이터 추출
    const tData = ctx.getImageData(
      adjustedROIS.testo.x,
      adjustedROIS.testo.y,
      adjustedROIS.testo.w,
      adjustedROIS.testo.h
    );
    const eData = ctx.getImageData(
      adjustedROIS.estro.x,
      adjustedROIS.estro.y,
      adjustedROIS.estro.w,
      adjustedROIS.estro.h
    );
    const cData = ctx.getImageData(
      adjustedROIS.control.x,
      adjustedROIS.control.y,
      adjustedROIS.control.w,
      adjustedROIS.control.h
    );
    const grayData = ctx.getImageData(
      adjustedROIS.gray.x,
      adjustedROIS.gray.y,
      adjustedROIS.gray.w,
      adjustedROIS.gray.h
    );

    // 조명 보정 계수 계산
    const lightingCorrection = getLightingCorrection(grayData);

    // 각 라인의 색상 강도 분석
    const tIntensity = getLineColorIntensity(tData, "red");
    const eIntensity = getLineColorIntensity(eData, "blue");
    const cIntensity = getLineColorIntensity(cData, "green");

    // 조명 보정 적용
    const correctedT = tIntensity / lightingCorrection;
    const correctedE = eIntensity / lightingCorrection;
    const correctedC = cIntensity / lightingCorrection;

    // 제어선을 기준으로 정규화
    const tNorm = correctedC > 0.1 ? correctedT / correctedC : correctedT;
    const eNorm = correctedC > 0.1 ? correctedE / correctedC : correctedE;

    // 비율 계산 (0~1 범위로 정규화)
    const totalNorm = tNorm + eNorm;
    const balance = totalNorm > 0 ? Math.round((tNorm / totalNorm) * 100) : 50;

    return {
      balance,
      tNorm: Math.min(1, tNorm),
      eNorm: Math.min(1, eNorm),
      rawT: correctedT,
      rawE: correctedE,
    };
  };

  const drawGuide = useCallback(() => {
    const video = videoRef.current;
    const canvas = guideCanvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 비디오 크기에 비례하여 가이드라인 그리기
    const scaleX = canvas.width / 300;
    const scaleY = canvas.height / 150;

    const adjustedROIS = {
      control: {
        x: Math.round(ROIS.control.x * scaleX),
        y: Math.round(ROIS.control.y * scaleY),
        w: Math.round(ROIS.control.w * scaleX),
        h: Math.round(ROIS.control.h * scaleY),
      },
      testo: {
        x: Math.round(ROIS.testo.x * scaleX),
        y: Math.round(ROIS.testo.y * scaleY),
        w: Math.round(ROIS.testo.w * scaleX),
        h: Math.round(ROIS.testo.h * scaleY),
      },
      estro: {
        x: Math.round(ROIS.estro.x * scaleX),
        y: Math.round(ROIS.estro.y * scaleY),
        w: Math.round(ROIS.estro.w * scaleX),
        h: Math.round(ROIS.estro.h * scaleY),
      },
    };

    // 전체 스트립 영역 표시 (AR 스타일)
    const stripX = Math.round(40 * scaleX);
    const stripY = Math.round(10 * scaleY);
    const stripW = Math.round(260 * scaleX);
    const stripH = Math.round(130 * scaleY);

    // 외곽 프레임 (AR 느낌)
    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 4;
    ctx.setLineDash([]);
    ctx.strokeRect(stripX, stripY, stripW, stripH);

    // 코너 마커 (AR 느낌)
    const cornerSize = 20;
    ctx.lineWidth = 3;
    // 좌상단
    ctx.beginPath();
    ctx.moveTo(stripX, stripY + cornerSize);
    ctx.lineTo(stripX, stripY);
    ctx.lineTo(stripX + cornerSize, stripY);
    ctx.stroke();
    // 우상단
    ctx.beginPath();
    ctx.moveTo(stripX + stripW - cornerSize, stripY);
    ctx.lineTo(stripX + stripW, stripY);
    ctx.lineTo(stripX + stripW, stripY + cornerSize);
    ctx.stroke();
    // 좌하단
    ctx.beginPath();
    ctx.moveTo(stripX, stripY + stripH - cornerSize);
    ctx.lineTo(stripX, stripY + stripH);
    ctx.lineTo(stripX + cornerSize, stripY + stripH);
    ctx.stroke();
    // 우하단
    ctx.beginPath();
    ctx.moveTo(stripX + stripW - cornerSize, stripY + stripH);
    ctx.lineTo(stripX + stripW, stripY + stripH);
    ctx.lineTo(stripX + stripW, stripY + stripH - cornerSize);
    ctx.stroke();

    // 각 측정 영역 표시 (AR 스타일)
    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.globalAlpha = 0.8;

    // 제어선 영역
    ctx.strokeRect(
      adjustedROIS.control.x,
      adjustedROIS.control.y,
      adjustedROIS.control.w,
      adjustedROIS.control.h
    );
    ctx.fillStyle = "#00ff00";
    ctx.font = `${Math.round(14 * scaleX)}px system-ui`;
    ctx.fillText(
      "C",
      adjustedROIS.control.x + adjustedROIS.control.w / 2 - 5,
      adjustedROIS.control.y - 5
    );

    // 테스토스테론 영역
    ctx.strokeRect(
      adjustedROIS.testo.x,
      adjustedROIS.testo.y,
      adjustedROIS.testo.w,
      adjustedROIS.testo.h
    );
    ctx.fillText(
      "T",
      adjustedROIS.testo.x + adjustedROIS.testo.w / 2 - 5,
      adjustedROIS.testo.y - 5
    );

    // 에스트로겐 영역
    ctx.strokeRect(
      adjustedROIS.estro.x,
      adjustedROIS.estro.y,
      adjustedROIS.estro.w,
      adjustedROIS.estro.h
    );
    ctx.fillText(
      "E",
      adjustedROIS.estro.x + adjustedROIS.estro.w / 2 - 5,
      adjustedROIS.estro.y - 5
    );

    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // 안내 텍스트 (AR 스타일)
    ctx.fillStyle = "#00ff00";
    ctx.font = `bold ${Math.round(18 * scaleX)}px system-ui`;
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.strokeText("면역크로마토그래피 스트립을 맞춰주세요", stripX, stripY - 15);
    ctx.fillText("면역크로마토그래피 스트립을 맞춰주세요", stripX, stripY - 15);
  }, []);

  const drawGuideLoop = useCallback(() => {
    drawGuide();
    const id = requestAnimationFrame(drawGuideLoop);
    setRafId(id);
  }, [drawGuide]);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        setCameraVisible(true);
        videoRef.current.onloadedmetadata = () => {
          drawGuide();
          drawGuideLoop();
        };
      }
    } catch (error) {
      console.error("Camera error:", error);
      const { message, showModal, isOverlay } = getErrorMessage(error);

      setStatus({
        text: message,
        type: "error",
      });

      if (showModal) {
        setErrorMessage(message);
        setIsOverlayError(isOverlay ?? false);
        setShowPermissionError(true);
      } else {
        onCloseRef.current?.();
      }
    }
  }, [setStream, setCameraVisible, setStatus, drawGuide, drawGuideLoop, getErrorMessage]);

  useEffect(() => {
    // 컴포넌트 마운트 시 자동으로 카메라 시작
    void startCamera();
  }, [startCamera]);

  const capture = () => {
    setCameraVisible(false);
    setStatus({
      text: "분석 중... ⏳",
      type: "loading",
    });

    setTimeout(() => {
      try {
        const result = analyzeStrip();
        onCapture(result);
      } catch {
        setStatus({
          text: "분석 중 오류가 발생했습니다.",
          type: "error",
        });
        onCapture(null);
      }
    }, 500);
  };

  const stopCamera = useCallback(() => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      setRafId(null);
    }
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
      setStream(null);
    }
  }, [rafId, stream, setStream]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleRetry = useCallback(() => {
    setShowPermissionError(false);
    void startCamera();
  }, [startCamera]);

  return (
    <div className="relative">
      {showPermissionError && (
        <CameraPermissionError
          errorMessage={errorMessage}
          isOverlayError={isOverlayError}
          onClose={() => onCloseRef.current?.()}
          onRetry={handleRetry}
        />
      )}
      {cameraVisible && (
        <>
          <div className="relative my-5 overflow-hidden rounded-2xl bg-black">
            <video
              aria-label="카메라 미리보기"
              autoPlay
              className="h-[400px] w-full object-cover"
              muted
              playsInline
              ref={videoRef}
            />
            <canvas
              className="pointer-events-none absolute top-0 left-0 h-full w-full"
              ref={guideCanvasRef}
            />
            <div className="absolute right-0 bottom-20 left-0 flex justify-center gap-3">
              <button
                aria-label="닫기"
                className="h-14 w-14 rounded-full border-2 border-white bg-black/50 text-white backdrop-blur-sm"
                onClick={() => {
                  stopCamera();
                  onCloseRef.current?.();
                }}
                type="button"
              >
                ✕
              </button>
              <button
                aria-label="사진 촬영"
                className="h-20 w-20 rounded-full border-4 border-white bg-white shadow-lg"
                onClick={capture}
                type="button"
              >
                <span className="text-3xl">📸</span>
              </button>
            </div>
          </div>
          <p className="mb-2 text-center text-gray-600 text-sm">
            AR 가이드라인에 스트립을 맞춰주세요
          </p>
        </>
      )}
      {!cameraVisible && (
        <div className="my-5 text-center">
          <p className="mb-3 text-gray-600">카메라를 시작하는 중...</p>
        </div>
      )}
    </div>
  );
}
