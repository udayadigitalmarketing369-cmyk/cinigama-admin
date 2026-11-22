"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Users,
  Download,
  Eye,
  ShieldCheck,
  Tag,
  Filter,
  Image as ImageIcon,
} from "lucide-react";
import { EventItem, SearchResponseData, SearchResultItem } from "@/types/api";
import { getPhotoViewUrl, getPhotoThumbnailUrl } from "@/services/api";

interface SearchResultsViewProps {
  event: EventItem;
  results: SearchResponseData;
  onBack: () => void;
  onOpenPreview: (item: SearchResultItem, event: EventItem, sessionId: string) => void;
}

export const SearchResultsView: React.FC<SearchResultsViewProps> = ({
  event,
  results,
  onBack,
  onOpenPreview,
}) => {
  const [filterType, setFilterType] = useState<"all" | "face_match" | "public">("all");

  const filteredItems = results.items.filter((item) => {
    if (filterType === "all") return true;
    return item.match_type === filterType;
  });

  const handleDownload = async (e: React.MouseEvent, item: SearchResultItem) => {
    e.stopPropagation();
    const downloadUrl = getPhotoViewUrl(event.id, item.photo.id, results.session_id);
    try {
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.target = "_blank";
      link.download = item.photo.original_filename || `photo_${item.photo.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition mb-3 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
            <span>Back to All Events</span>
          </button>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {event.name}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Matched
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Displaying photos matched using your search session
          </p>
        </div>

        <button
          onClick={onBack}
          className="self-start md:self-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Search with Another Selfie</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-white">{results.matched_count}</p>
            <p className="text-[11px] text-slate-400">Direct Face Matches</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-white">{results.public_count}</p>
            <p className="text-[11px] text-slate-400">Public Event Photos</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-white">{results.faces_detected_in_selfie}</p>
            <p className="text-[11px] text-slate-400">Faces in Selfie</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="truncate">
            <p className="text-xs font-mono font-medium text-slate-200 truncate">
              {results.session_id.substring(0, 10)}...
            </p>
            <p className="text-[11px] text-slate-400">Active Search Session</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition ${
              filterType === "all"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All Photos ({results.total_returned})
          </button>
          <button
            onClick={() => setFilterType("face_match")}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition ${
              filterType === "face_match"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            My Face Matches ({results.matched_count})
          </button>
          <button
            onClick={() => setFilterType("public")}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition ${
              filterType === "public"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Public Photos ({results.public_count})
          </button>
        </div>

        <span className="text-xs text-slate-400">
          Showing {filteredItems.length} photograph{filteredItems.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Photos Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
          <ImageIcon className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">No photos in this category</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Switch filters or try scanning another selfie with clearer lighting and forward angle.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((item, idx) => {
            const isMatch = item.match_type === "face_match";
            const imageUrl = getPhotoThumbnailUrl(event.id, item.photo.id, results.session_id);

            return (
              <div
                key={item.photo.id || idx}
                onClick={() => onOpenPreview(item, event, results.session_id)}
                className="group relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg hover:border-slate-700 hover:shadow-indigo-500/5 transition cursor-pointer flex flex-col"
              >
                {/* Image Container */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
                  <img
                    src={imageUrl}
                    alt={item.photo.original_filename}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80" />

                  {/* Badges on Top */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2">
                    {isMatch ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/90 text-white shadow-md backdrop-blur-md">
                        <Sparkles className="w-3 h-3" />
                        <span>
                          {item.similarity_score
                            ? `${Math.round(item.similarity_score * 100)}% Match`
                            : "Face Match"}
                        </span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-900/80 text-slate-300 border border-slate-700/60 backdrop-blur-md">
                        <Tag className="w-3 h-3" />
                        <span>Public</span>
                      </span>
                    )}

                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 text-slate-300 backdrop-blur-md">
                      <Users className="w-3 h-3 text-indigo-400" />
                      <span>{item.photo.face_count || 1} face{item.photo.face_count === 1 ? "" : "s"}</span>
                    </span>
                  </div>

                  {/* Hover Quick Actions */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition duration-200">
                    <button
                      type="button"
                      onClick={(e) => handleDownload(e, item)}
                      title="Download photo"
                      className="p-2 rounded-xl bg-slate-900/90 text-white hover:bg-indigo-600 shadow-md backdrop-blur-md transition"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Preview full size"
                      className="p-2 rounded-xl bg-slate-900/90 text-white hover:bg-indigo-600 shadow-md backdrop-blur-md transition"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Info Footer */}
                <div className="p-3.5 flex items-center justify-between text-xs">
                  <div className="truncate mr-2">
                    <p className="font-medium text-slate-200 truncate">
                      {item.photo.original_filename}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">
                      ID: {item.photo.id.substring(0, 14)}...
                    </p>
                  </div>
                  {item.detection_confidence && (
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      Conf: {(item.detection_confidence * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

