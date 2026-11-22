"use client";

import React, { useState } from "react";
import { X, Server, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { DEFAULT_API_BASE } from "@/services/api";

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiBaseUrl: string;
  onSaveUrl: (url: string) => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  isOpen,
  onClose,
  apiBaseUrl,
  onSaveUrl,
}) => {
  const [urlInput, setUrlInput] = useState(apiBaseUrl);
  const [testingStatus, setTestingStatus] = useState<"idle" | "testing" | "success" | "failed">("idle");
  const [testMessage, setTestMessage] = useState("");

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestingStatus("testing");
    setTestMessage("Pinging API endpoint...");
    try {
      const res = await fetch(`${urlInput.replace(/\/+$/, "")}/api/v1/events`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (res.ok || res.status === 401 || res.status === 403) {
        setTestingStatus("success");
        setTestMessage(`Host responded with HTTP ${res.status}. Connection active!`);
      } else {
        setTestingStatus("failed");
        setTestMessage(`Server returned HTTP ${res.status}.`);
      }
    } catch (err: unknown) {
      setTestingStatus("failed");
      const msg = err instanceof Error ? err.message : String(err);
      setTestMessage(`Unable to reach endpoint (${msg}).`);
    }
  };

  const handleSave = () => {
    onSaveUrl(urlInput.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">API Connection Settings</h3>
            <p className="text-xs text-slate-400">Configure target backend server URL</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Backend Base URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="http://localhost"
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingStatus === "testing"}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {testingStatus === "testing" ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                ) : (
                  "Test"
                )}
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setUrlInput(DEFAULT_API_BASE)}
                className="text-[11px] text-indigo-400 hover:underline"
              >
                Reset to default ({DEFAULT_API_BASE})
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => setUrlInput("/proxy-api/v1")}
                className="text-[11px] text-indigo-400 hover:underline"
              >
                Use Next.js Proxy (/proxy-api/v1)
              </button>
            </div>
          </div>

          {testingStatus !== "idle" && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                testingStatus === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                  : testingStatus === "failed"
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-300"
                  : "bg-slate-800 border-slate-700 text-slate-300"
              }`}
            >
              {testingStatus === "success" && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />}
              {testingStatus === "failed" && <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />}
              <span>{testMessage}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

