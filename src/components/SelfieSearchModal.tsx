"use client";

import React, { useState } from "react";
import {
  X,
  Camera,
  Upload,
  CheckCircle,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  ScanFace,
  ChevronRight,
  Info,
} from "lucide-react";
import { EventItem, SearchResponseData } from "@/types/api";
import { recordConsent, searchPhotosWithSelfie } from "@/services/api";
import { WebcamCapture } from "./WebcamCapture";

interface SelfieSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  onSearchResults: (results: SearchResponseData, event: EventItem) => void;
}

type Step = "consent" | "capture" | "searching";

export const SelfieSearchModal: React.FC<SelfieSearchModalProps> = ({
  isOpen,
  onClose,
  event,
  onSearchResults,
}) => {
  const [step, setStep] = useState<Step>("consent");
  const [consentChecked, setConsentChecked] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeInputTab, setActiveInputTab] = useState<"upload" | "webcam">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !event) return null;

  // Step 1: Record Consent
  const handleProceedConsent = async () => {
    if (!consentChecked) {
      setErrorMsg("Please accept the facial recognition consent to proceed.");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await recordConsent(event.id, "facial_recognition_search");
      if (res.success && res.data?.session_id) {
        setSessionId(res.data.session_id);
        setStep("capture");
      } else {
        setErrorMsg(res.message || "Could not initialize search session.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg || "Consent recording failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setSelectedPreview(url);
    }
  };

  // Step 2: Handle Webcam capture
  const handleWebcamCapture = (blob: Blob, previewUrl: string) => {
    const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: "image/jpeg" });
    setSelectedFile(file);
    setSelectedPreview(previewUrl);
    setActiveInputTab("upload"); // show preview
  };

  // Step 3: Trigger facial recognition search
  const handlePerformSearch = async () => {
    if (!selectedFile || !sessionId) {
      setErrorMsg("Please take or upload a selfie first.");
      return;
    }

    setStep("searching");
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const response = await searchPhotosWithSelfie(event.id, selectedFile, sessionId);
      if (response.success && response.data) {
        onSearchResults(response.data, event);
        onClose();
      } else {
        setErrorMsg(response.message || "Failed to search photos with selfie.");
        setStep("capture");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg || "Face recognition search encountered an error.");
      setStep("capture");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetModal = () => {
    setStep("consent");
    setSessionId(null);
    setSelectedFile(null);
    setSelectedPreview(null);
    setErrorMsg("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-7 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <button
          onClick={handleResetModal}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30">
            <ScanFace className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-semibold tracking-wider text-indigo-400">
                Selfie Photo Finder
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                {event.access_type}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {event.name}
            </h2>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Consent */}
        {step === "consent" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {event.description && event.description.toLowerCase() !== "nil" && (
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-indigo-500/20 text-xs text-slate-200 max-h-36 overflow-y-auto leading-relaxed whitespace-pre-line">
                {event.description}
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Attendee Facial Search Consent</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    To find event photographs where you appear, our system will temporarily extract facial
                    landmarks from your uploaded selfie and match them with faces detected in the
                    event gallery.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Purpose: <strong>facial_recognition_search</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Your selfie is securely processed and not published publicly.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Temporary session created for secure tokenized photo delivery.</span>
                </div>
              </div>
            </div>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-800 cursor-pointer select-none hover:bg-slate-800/60 transition">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 bg-slate-900 border-slate-700"
              />
              <span className="text-xs font-medium text-slate-200">
                I give consent to record my search session and perform facial recognition matching.
              </span>
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetModal}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedConsent}
                disabled={isSubmitting || !consentChecked}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Agree & Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Capture or Upload Selfie */}
        {step === "capture" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {sessionId && (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-[11px] text-indigo-300">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  Consent Recorded
                </span>
                <span className="font-mono text-slate-400">
                  Session: {sessionId.substring(0, 16)}...
                </span>
              </div>
            )}

            {/* Input method tabs */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveInputTab("upload")}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
                  activeInputTab === "upload"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Selfie File</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveInputTab("webcam")}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
                  activeInputTab === "webcam"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Take Live Selfie</span>
              </button>
            </div>

            {/* Upload Zone */}
            {activeInputTab === "upload" && (
              <div className="space-y-3">
                {selectedPreview ? (
                  <div className="flex flex-col items-center p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="relative w-44 h-44 rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-xl">
                      <img
                        src={selectedPreview}
                        alt="Selected selfie"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-slate-300 font-medium">
                        {selectedFile?.name || "selfie.jpg"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setSelectedPreview(null);
                        }}
                        className="text-xs text-rose-400 hover:underline"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-950/60 hover:bg-slate-950 transition group">
                    <div className="w-14 h-14 rounded-full bg-indigo-500/10 group-hover:bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3 transition">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-200">
                      Click to browse or drag & drop your selfie
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      JPEG, PNG, or WEBP. Clear, forward-facing photo recommended.
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}

            {/* Webcam Zone */}
            {activeInputTab === "webcam" && (
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex justify-center">
                <WebcamCapture
                  onCapture={handleWebcamCapture}
                  onCancel={() => setActiveInputTab("upload")}
                />
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep("consent")}
                className="text-xs text-slate-400 hover:text-white"
              >
                Back to Consent
              </button>
              <button
                type="button"
                onClick={handlePerformSearch}
                disabled={!selectedFile || isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>Search Photos with AI</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Searching Animation */}
        {step === "searching" && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative w-36 h-36 rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-2xl bg-black">
              {selectedPreview && (
                <img
                  src={selectedPreview}
                  alt="Analyzing face"
                  className="w-full h-full object-cover filter brightness-75"
                />
              )}
              {/* Laser scan line animation */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-bounce top-1/3" />
              <div className="absolute inset-0 border border-indigo-400/50 rounded-2xl animate-pulse" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Analyzing Facial Embeddings...</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Comparing your facial features against {event.photo_count || "all"} photographs in {event.name}
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span>POST /api/v1/events/{event.id.substring(0, 8)}.../search</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

