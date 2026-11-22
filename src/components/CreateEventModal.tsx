"use client";

import React, { useState } from "react";
import { X, CalendarPlus, ShieldCheck, Globe, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { createEvent } from "@/services/api";
import { EventItem, UserSession } from "@/types/api";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: UserSession | null;
  onEventCreated: (event: EventItem) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  session,
  onEventCreated,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [accessType, setAccessType] = useState<"public" | "private">("public");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Please enter an event name.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const response = await createEvent(
        {
          name: name.trim(),
          description: description.trim(),
          access_type: accessType,
        },
        session?.tokens.access_token
      );

      if (response.success && response.data) {
        onEventCreated(response.data);
        setName("");
        setDescription("");
        setAccessType("public");
        onClose();
      } else {
        setErrorMsg(response.message || "Failed to create event.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg || "An error occurred while creating event.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-7 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30">
            <CalendarPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Create New Event</h3>
            <p className="text-xs text-slate-400">
              Publish an event to ingest photographs and enable attendee facial recognition
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Event Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Global Tech Summit 2026"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Annual technology convention & keynote showcase..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Access Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAccessType("public")}
                className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition ${
                  accessType === "public"
                    ? "bg-indigo-600/10 border-indigo-500 text-white"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Globe className={`w-4 h-4 ${accessType === "public" ? "text-indigo-400" : ""}`} />
                <div>
                  <p className="text-xs font-semibold">Public Event</p>
                  <p className="text-[10px] text-slate-500">Visible to all attendees</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAccessType("private")}
                className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition ${
                  accessType === "private"
                    ? "bg-indigo-600/10 border-indigo-500 text-white"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Lock className={`w-4 h-4 ${accessType === "private" ? "text-indigo-400" : ""}`} />
                <div>
                  <p className="text-xs font-semibold">Private Event</p>
                  <p className="text-[10px] text-slate-500">Restricted search</p>
                </div>
              </button>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Event</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

