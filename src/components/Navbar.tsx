"use client";

import React from "react";
import { Camera, Settings, ShieldCheck, User, LogOut, PlusCircle, Sparkles } from "lucide-react";
import { UserSession } from "@/types/api";

interface NavbarProps {
  session: UserSession | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenCreateEvent: () => void;
  onOpenSettings: () => void;
  apiBaseUrl: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  session,
  onOpenAuth,
  onLogout,
  onOpenCreateEvent,
  onOpenSettings,
  apiBaseUrl,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                EventSnap AI
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Face Match
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Find your event photos with a single selfie
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* API Base URL Badge */}
          <button
            onClick={onOpenSettings}
            title={`API Endpoint: ${apiBaseUrl}`}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20 transition"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="hidden md:inline font-mono text-[11px] truncate max-w-[160px]">
              {apiBaseUrl}
            </span>
            <span className="md:hidden">API</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            title={`Configure API: ${apiBaseUrl}`}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800 transition"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Organiser Section */}
          {session ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenCreateEvent}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/30 transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Event</span>
              </button>

              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-medium text-slate-200 max-w-[120px] truncate">
                    {session.fullName || session.email}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  title="Log out"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-medium shadow-md shadow-indigo-600/30 transition active:scale-[0.98]"
            >
              <User className="w-4 h-4" />
              <span>Organiser Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

