"use client";

import React, { useRef, useState, useEffect } from "react";
import { Camera, RefreshCw, Check, AlertCircle, Sparkles } from "lucide-react";

interface WebcamCaptureProps {
  onCapture: (blob: Blob, previewUrl: string) => void;
  onCancel: () => void;
}

export const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  const startCamera = async () => {
    setErrorMsg("");
    setIsReady(false);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser environment.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsReady(true);
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Unable to access camera: ${msg}. You can upload a photo file instead.`);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const handleSnap = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedPreview(dataUrl);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
        }
      },
      "image/jpeg",
      0.92
    );
  };

  const handleRetake = () => {
    setCapturedPreview(null);
    setCapturedBlob(null);
  };

  const handleConfirm = () => {
    if (capturedBlob && capturedPreview) {
      stopCamera();
      onCapture(capturedBlob, capturedPreview);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {errorMsg ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex flex-col items-center gap-3 w-full">
          <AlertCircle className="w-8 h-8 text-rose-400" />
          <p className="text-center">{errorMsg}</p>
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs"
          >
            Switch to File Upload
          </button>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center">
          {/* Viewport */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-2xl overflow-hidden bg-black border-2 border-indigo-500/30 shadow-inner flex items-center justify-center">
            {capturedPreview ? (
              <img
                src={capturedPreview}
                alt="Captured selfie"
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            )}

            {/* Guide overlay for face alignment */}
            {!capturedPreview && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-44 h-56 rounded-full border-2 border-dashed border-white/50 flex items-center justify-center animate-pulse" />
                <span className="text-[10px] text-white/80 bg-black/50 px-2 py-0.5 rounded-full mt-2 font-medium">
                  Center your face
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex items-center gap-3">
            {!capturedPreview ? (
              <>
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSnap}
                  disabled={!isReady}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  <span>Snap Photo</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retake</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Use This Selfie</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

