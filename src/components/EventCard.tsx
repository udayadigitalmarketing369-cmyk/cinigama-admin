"use client";

import React from "react";
import { Camera, Lock, Globe, Sparkles, Image as ImageIcon, Settings2, Users } from "lucide-react";
import { EventItem, UserSession } from "@/types/api";

interface EventCardProps {
  event: EventItem;
  session: UserSession | null;
  onSelectEvent: (event: EventItem) => void;
  onManageEvent?: (event: EventItem) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  session,
  onSelectEvent,
  onManageEvent,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const isPublic = event.access_type === "public";
  const desc = event.description && event.description.toLowerCase() !== "nil" ? event.description : "";
  const isLongDesc = desc.length > 110 || desc.includes("\n");

  return (
    <div className="group rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-xl overflow-hidden transition duration-300 flex flex-col hover:shadow-indigo-500/5">
      {/* Cover Image banner */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-950 flex items-center justify-center">
        {event.cover_image ? (
          <img
            src={event.cover_image}
            alt={event.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-slate-700 group-hover:text-indigo-400 transition" />
          </div>
        )}

        {/* Gradient shade */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between">
          <span
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md shadow-sm ${
              isPublic
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            }`}
          >
            {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            <span className="capitalize">{event.access_type}</span>
          </span>

          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/60 text-slate-200 border border-white/10 backdrop-blur-md">
            {event.photo_count !== undefined && event.photo_count !== null ? (
              <>
                <ImageIcon className="w-3 h-3 text-indigo-400" />
                <span>{event.photo_count} photos</span>
              </>
            ) : (
              <span className="capitalize text-emerald-400">{event.status || "Active"}</span>
            )}
          </span>
        </div>
      </div>

      {/* Body details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-indigo-300 transition tracking-tight line-clamp-2">
              {event.name}
            </h3>
            {event.created_at && (
              <span className="text-[10px] text-slate-500 shrink-0 font-mono mt-0.5">
                {new Date(event.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-300 leading-relaxed">
            <p className={`whitespace-pre-line ${!isExpanded ? "line-clamp-3" : ""}`}>
              {desc || "Select event to scan and find your photos with a selfie."}
            </p>
            {isLongDesc && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                {isExpanded ? "Show Less" : "Read Full Invitation..."}
              </button>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col gap-2">
          {/* Main Action: Attendee Find My Photos */}
          <button
            onClick={() => onSelectEvent(event)}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 group/btn active:scale-[0.99]"
          >
            <Camera className="w-4 h-4 group-hover/btn:scale-110 transition" />
            <span>Find My Photos (Selfie)</span>
          </button>

          {/* Secondary Action: Organiser Manage & Upload */}
          {session && onManageEvent && (
            <button
              onClick={() => onManageEvent(event)}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/80 transition flex items-center justify-center gap-1.5"
            >
              <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Manage & Upload Photos</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

