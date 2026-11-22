"use client";

import React, { useState } from "react";
import { X, Lock, Mail, User as UserIcon, ShieldAlert, Sparkles, CheckCircle, ArrowRight } from "lucide-react";
import { loginOrganiser, registerOrganiser } from "@/services/api";
import { UserSession } from "@/types/api";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: UserSession) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"organiser">("organiser");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (activeTab === "login") {
        const response = await loginOrganiser({ email, password });
        if (response.success && response.data) {
          const session: UserSession = {
            email,
            fullName: fullName || email.split("@")[0],
            role: "organiser",
            tokens: response.data,
          };
          onSuccess(session);
          onClose();
        } else {
          setErrorMsg(response.message || "Login failed. Check your credentials.");
        }
      } else {
        const response = await registerOrganiser({
          full_name: fullName,
          email,
          password,
          role: "organiser",
        });
        if (response.success && response.data) {
          setSuccessMsg("Account registered successfully! Logging you in...");
          setTimeout(() => {
            const session: UserSession = {
              email,
              fullName,
              role: "organiser",
              tokens: response.data,
            };
            onSuccess(session);
            onClose();
          }, 800);
        } else {
          setErrorMsg(response.message || "Registration failed.");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-7 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-800 mb-6">
          <button
            onClick={() => {
              setActiveTab("login");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`flex-1 pb-3 text-sm font-semibold transition border-b-2 ${
              activeTab === "login"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Organiser Log In
          </button>
          <button
            onClick={() => {
              setActiveTab("register");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`flex-1 pb-3 text-sm font-semibold transition border-b-2 ${
              activeTab === "register"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Create Account
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === "register" && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Priya Sharma"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="priya@studioevents.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {activeTab === "register" && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Role
              </label>
              <input
                type="text"
                disabled
                value={role}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-sm text-slate-400 cursor-not-allowed capitalize"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Required for event creation and photo ingestion permissions.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{activeTab === "login" ? "Sign In as Organiser" : "Create Organiser Account"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-xs text-slate-400">
            {activeTab === "login" ? "Don't have an organiser account yet?" : "Already registered?"}{" "}
            <button
              onClick={() => {
                setActiveTab(activeTab === "login" ? "register" : "login");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className="text-indigo-400 hover:underline font-semibold"
            >
              {activeTab === "login" ? "Create one here" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

