"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { EventList } from "@/components/EventList";
import { SelfieSearchModal } from "@/components/SelfieSearchModal";
import { SearchResultsView } from "@/components/SearchResultsView";
import { AuthModal } from "@/components/AuthModal";
import { CreateEventModal } from "@/components/CreateEventModal";
import { ManageEventModal } from "@/components/ManageEventModal";
import { ImagePreviewModal } from "@/components/ImagePreviewModal";
import { ApiSettingsModal } from "@/components/ApiSettingsModal";
import { EventItem, SearchResponseData, SearchResultItem, UserSession } from "@/types/api";
import {
  DEFAULT_API_BASE,
  fetchEvents,
  getStoredApiBaseUrl,
  setStoredApiBaseUrl,
} from "@/services/api";

const SESSION_KEY = "eventsnap_user_session";

export default function HomePage() {
  // Global State
  const [session, setSession] = useState<UserSession | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [apiNotice, setApiNotice] = useState<string | undefined>(undefined);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(DEFAULT_API_BASE);

  // Modal Visibility State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSelfieModalOpen, setIsSelfieModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Selected Entities
  const [selectedEventForSearch, setSelectedEventForSearch] = useState<EventItem | null>(null);
  const [selectedEventForManage, setSelectedEventForManage] = useState<EventItem | null>(null);
  const [searchResults, setSearchResults] = useState<{
    data: SearchResponseData;
    event: EventItem;
  } | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<{
    item: SearchResultItem;
    event: EventItem;
    sessionId: string;
  } | null>(null);

  // Initialize from LocalStorage
  useEffect(() => {
    setApiBaseUrl(getStoredApiBaseUrl());

    try {
      const storedSession = localStorage.getItem(SESSION_KEY);
      if (storedSession) {
        setSession(JSON.parse(storedSession));
      }
    } catch (e) {
      console.error("Failed to load stored session:", e);
    }
  }, []);

  // Fetch Events from API
  const loadEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    setApiNotice(undefined);
    try {
      const fetchedEvents = await fetchEvents();
      setEvents(fetchedEvents);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Error fetching events:", msg);
      setApiNotice(msg);
      setEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Auth Handlers
  const handleAuthSuccess = (newSession: UserSession) => {
    setSession(newSession);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem(SESSION_KEY);
  };

  // Settings Handlers
  const handleSaveApiUrl = (newUrl: string) => {
    setStoredApiBaseUrl(newUrl);
    setApiBaseUrl(newUrl);
    loadEvents();
  };

  // Attendee Search Handlers
  const handleSelectEventForSearch = (event: EventItem) => {
    setSelectedEventForSearch(event);
    setIsSelfieModalOpen(true);
  };

  const handleSearchResultsReceived = (data: SearchResponseData, event: EventItem) => {
    setSearchResults({ data, event });
  };

  // Organiser Manage Handlers
  const handleOpenManageEvent = (event: EventItem) => {
    setSelectedEventForManage(event);
    setIsManageModalOpen(true);
  };

  const handleEventCreated = (newEvent: EventItem) => {
    setEvents((prev) => [newEvent, ...prev]);
  };

  const handleEventUpdated = (updated: EventItem) => {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)));
    if (selectedEventForManage?.id === updated.id) {
      setSelectedEventForManage((prev) => (prev ? { ...prev, ...updated } : prev));
    }
  };

  // Lightbox Preview Handler
  const handleOpenPreview = (item: SearchResultItem, event: EventItem, sessionId: string) => {
    setPreviewPhoto({ item, event, sessionId });
    setIsPreviewOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        session={session}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenCreateEvent={() => setIsCreateEventOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        apiBaseUrl={apiBaseUrl}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {searchResults ? (
          <SearchResultsView
            event={searchResults.event}
            results={searchResults.data}
            onBack={() => setSearchResults(null)}
            onOpenPreview={handleOpenPreview}
          />
        ) : (
          <EventList
            events={events}
            isLoading={isLoadingEvents}
            session={session}
            onSelectEvent={handleSelectEventForSearch}
            onManageEvent={handleOpenManageEvent}
            onOpenCreateEvent={() => setIsCreateEventOpen(true)}
            onRefresh={loadEvents}
            notice={apiNotice}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>EventSnap AI — Automated Face Recognition Event Photography</span>
          <span className="font-mono text-[11px] text-slate-600">
            API: {apiBaseUrl}
          </span>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <CreateEventModal
        isOpen={isCreateEventOpen}
        onClose={() => setIsCreateEventOpen(false)}
        session={session}
        onEventCreated={handleEventCreated}
      />

      <ManageEventModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        event={selectedEventForManage}
        session={session}
        onRefreshEvents={loadEvents}
        onEventUpdated={handleEventUpdated}
      />

      <SelfieSearchModal
        isOpen={isSelfieModalOpen}
        onClose={() => setIsSelfieModalOpen(false)}
        event={selectedEventForSearch}
        onSearchResults={handleSearchResultsReceived}
      />

      <ImagePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        item={previewPhoto?.item || null}
        event={previewPhoto?.event || null}
        sessionId={previewPhoto?.sessionId || ""}
      />

      <ApiSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiBaseUrl={apiBaseUrl}
        onSaveUrl={handleSaveApiUrl}
      />
    </div>
  );
}

