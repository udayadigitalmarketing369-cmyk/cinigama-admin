"use client";

import React, { useState } from "react";
import { Search, Calendar, Globe, Lock, Filter, PlusCircle, RefreshCw } from "lucide-react";
import { EventItem, UserSession } from "@/types/api";
import { EventCard } from "./EventCard";

interface EventListProps {
  events: EventItem[];
  isLoading: boolean;
  session: UserSession | null;
  onSelectEvent: (event: EventItem) => void;
  onManageEvent: (event: EventItem) => void;
  onOpenCreateEvent: () => void;
  onRefresh: () => void;
  notice?: string;
}

export const EventList: React.FC<EventListProps> = ({
  events,
  isLoading,
  session,
  onSelectEvent,
  onManageEvent,
  onOpenCreateEvent,
  onRefresh,
  notice,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [accessFilter, setAccessFilter] = useState<"all" | "public" | "private">("all");

  const filteredEvents = events.filter((ev) => {
    const matchesQuery =
      ev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.description && ev.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesAccess = accessFilter === "all" || ev.access_type === accessFilter;
    return matchesQuery && matchesAccess;
  });

  return (
    <div className="space-y-6">
      {/* Notice bar if API error occurs */}
      {notice && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
          <span>{notice}</span>
          <button
            onClick={onRefresh}
            className="text-[11px] underline hover:text-white font-medium ml-2"
          >
            Retry API
          </button>
        </div>
      )}

      {/* Hero header */}
      <div className="relative rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/20 shadow-2xl overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <span>✨ AI-Powered Event Photography</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Select an Event to <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Find Your Photos</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Choose any event below and upload a quick selfie. Our facial recognition engine will
            scan thousands of high-resolution photos and instantly deliver the moments featuring you.
          </p>
        </div>

        {/* Decorative circle glow */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events by name or keyword..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Access Filter Pills */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setAccessFilter("all")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                accessFilter === "all"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setAccessFilter("public")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                accessFilter === "public"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Public
            </button>
            <button
              onClick={() => setAccessFilter("private")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                accessFilter === "private"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Private
            </button>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh events list"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Grid of Events */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4 animate-pulse"
            >
              <div className="aspect-[16/9] w-full rounded-xl bg-slate-800" />
              <div className="h-4 bg-slate-800 rounded w-3/4" />
              <div className="h-3 bg-slate-800 rounded w-1/2" />
              <div className="h-10 bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">No events found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No events match "${searchQuery}". Try a different keyword.`
              : "No events are currently published."}
          </p>
          {session && (
            <button
              onClick={onOpenCreateEvent}
              className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition inline-flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create First Event</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              session={session}
              onSelectEvent={onSelectEvent}
              onManageEvent={onManageEvent}
            />
          ))}
        </div>
      )}
    </div>
  );
};

