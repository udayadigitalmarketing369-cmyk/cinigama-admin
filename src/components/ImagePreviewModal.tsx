"use client";

import React from "react";
import { X, Download, ShieldCheck, Tag, Users, Sparkles } from "lucide-react";
import { EventItem, SearchResultItem } from "@/types/api";
import { getPhotoViewUrl } from "@/services/api";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: SearchResultItem | null;
  event: EventItem | null;
  sessionId: string;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  item,
  event,
  sessionId,
}) => {
  if (!isOpen || !item || !event) return null;

  const viewUrl = getPhotoViewUrl(event.id, item.photo.id, sessionId);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = viewUrl;
    link.target = "_blank";
    link.download = item.photo.original_filename || `photo_${item.photo.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3 truncate mr-3">
            <span className="font-semibold text-sm text-white truncate">
              {item.photo.original_filename}
            </span>
            {item.match_type === "face_match" ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-3 h-3" />
                {item.similarity_score
                  ? `${Math.round(item.similarity_score * 100)}% Similarity`
                  : "Matched"}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                Public Photo
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image viewport */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-black/60 min-h-[300px]">
          <img
            src={viewUrl}
            alt={item.photo.original_filename}
            className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
          />
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Faces Detected: {item.photo.face_count || 1}</span>
            </span>
            {item.detection_confidence && (
              <span>Confidence: {(item.detection_confidence * 100).toFixed(1)}%</span>
            )}
            <span className="font-mono text-slate-500">Photo ID: {item.photo.id}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Delivered via Session: {sessionId.substring(0, 8)}...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

