"use client";

import { useAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type AnalysisResult,
  cameraStreamAtom,
  cameraVisibleAtom,
  statusMessageAtom,
} from "~/stores/hormone";

const ROIS = {
  control: { x: 50, y: 20, w: 40, h: 60 },
  testo: { x: 120, y: 20, w: 40, h: 60 },
  estro: { x: 190, y: 20, w: 40, h: 60 },
  gray: { x: 10, y: 10, w: 30, h: 30 },
};

interface CameraCaptureProps {
  onCapture: (result: AnalysisResult | null) => void;
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const [stream, setStream] = useAtom(cameraStreamAtom);
  const [cameraVisible, setCameraVisible] = useAtom(cameraVisibleAtom);
  const [, setStatus] = useAtom(statusMessageAtom);
  const videoRef = useRef<HTMLVideoElement>(null);
  const guideCanvasRef = useRef<HTMLCanvasElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rafId, setRafId] = useState<number | null>(null);

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

  const drawGuide = () => {
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

    // 전체 스트립 영역 표시
    const stripX = Math.round(40 * scaleX);
    const stripY = Math.round(10 * scaleY);
    const stripW = Math.round(260 * scaleX);
    const stripH = Math.round(130 * scaleY);

    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 3;
    ctx.strokeRect(stripX, stripY, stripW, stripH);

    // 각 측정 영역 표시
    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

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

    // 안내 텍스트
    ctx.fillStyle = "#00ff00";
    ctx.font = `${Math.round(16 * scaleX)}px system-ui`;
    ctx.fillText("면역크로마토그래피 스트립을 맞춰주세요", stripX, stripY - 10);
  };

  const drawGuideLoop = () => {
    drawGuide();
    const id = requestAnimationFrame(drawGuideLoop);
    setRafId(id);
  };

  const startCamera = async () => {
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
    } catch {
      setStatus({
        text: "카메라 권한이 필요합니다!",
        type: "error",
      });
      alert("카메라 권한이 필요합니다!");
    }
  };

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

  return (
    <div>
      {!cameraVisible && (
        <button
          className="rounded-full bg-gradient-to-r from-[#ff6b6b] to-[#feca57] px-6 py-3 font-bold text-base text-white transition-transform active:scale-95"
          onClick={startCamera}
          type="button"
        >
          촬영 시작
        </button>
      )}

      {cameraVisible && (
        <div className="relative my-5 overflow-hidden rounded-2xl bg-black">
          <video
            aria-label="카메라 미리보기"
            autoPlay
            className="h-[300px] w-full object-cover"
            muted
            playsInline
            ref={videoRef}
          />
          <canvas
            className="pointer-events-none absolute top-0 left-0 h-full w-full"
            ref={guideCanvasRef}
          />
          <button
            aria-label="사진 촬영"
            className="-translate-x-1/2 absolute bottom-5 left-1/2 h-20 w-20 rounded-full border-4 border-[#ff6b6b] bg-white text-2xl"
            onClick={capture}
            type="button"
          >
            📸
          </button>
        </div>
      )}
    </div>
  );
}
