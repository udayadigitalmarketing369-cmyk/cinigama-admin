"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Upload,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  FileText,
  Trash2,
  Lock,
  Globe,
  Sparkles,
  BarChart3,
  Layers,
  Settings,
  Edit3,
  Eye,
  EyeOff,
  Search,
  ShieldAlert,
  UserX,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  Calendar,
  Save,
  Image as ImageIcon,
  StopCircle,
  RotateCw,
  ChevronDown,
  ChevronUp,
  FileWarning,
  Check,
} from "lucide-react";

export interface UploadFailureItem {
  id: string;
  fileName: string;
  fileSize: number;
  batchNumber: number;
  reason: string;
  file: File;
  failedAt: string;
}

export interface BatchProgressInfo {
  isActive: boolean;
  totalFiles: number;
  totalBatches: number;
  currentBatchIndex: number;
  currentBatchFiles: string[];
  processedFiles: number;
  successfulCount: number;
  failedCount: number;
  percentage: number;
  statusMessage: string;
}

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
import {
  EventItem,
  PhotoItem,
  ProcessingStatus,
  RestrictedFace,
  UserSession,
} from "@/types/api";
import {
  batchDeletePhotos,
  batchUpdatePhotosVisibility,
  deletePhoto,
  deleteRestrictedFace,
  fetchEventPhotos,
  getPhotoDirectThumbnailUrl,
  getProcessingStatus,
  getRestrictedFaceThumbnailUrl,
  listRestrictedFaces,
  restrictFaceFromDetectedFace,
  restrictFaceViaUpload,
  updateEvent,
  updatePhotoVisibility,
  uploadPhotosBulk,
} from "@/services/api";

interface ManageEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  session: UserSession | null;
  onRefreshEvents: () => void;
  onEventUpdated?: (updated: EventItem) => void;
}

type TabType = "details" | "photos" | "restricted" | "status";

export const ManageEventModal: React.FC<ManageEventModalProps> = ({
  isOpen,
  onClose,
  event,
  session,
  onRefreshEvents,
  onEventUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("photos");

  // Status & notifications
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ==========================================
  // TAB 1: Event Details State
  // ==========================================
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAccessType, setEditAccessType] = useState<"public" | "private">("public");
  const [editStatus, setEditStatus] = useState<"active" | "archived" | "draft">("active");
  const [editDate, setEditDate] = useState("");
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // Sync event details into edit state
  useEffect(() => {
    if (event) {
      setEditName(event.name || "");
      setEditSlug(event.slug || "");
      setEditDescription(event.description === "nil" ? "" : event.description || "");
      setEditAccessType(event.access_type || "public");
      setEditStatus(event.status || "active");
      setEditDate(event.event_date ? event.event_date.split("T")[0] : "");
    }
  }, [event]);

  const handleSaveEventDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setIsSavingDetails(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const updated = await updateEvent(
        event.id,
        {
          name: editName.trim(),
          description: editDescription,
          access_type: editAccessType,
          status: editStatus,
          event_date: editDate ? new Date(editDate).toISOString() : null,
          slug: editSlug.trim() || undefined,
        },
        session?.tokens.access_token
      );

      setSuccessMsg("Event details updated successfully.");
      if (onEventUpdated) onEventUpdated(updated);
      onRefreshEvents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Failed to update event details: ${msg}`);
    } finally {
      setIsSavingDetails(false);
    }
  };

  // ==========================================
  // TAB 2: Photos Management State
  // ==========================================
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [photoSearch, setPhotoSearch] = useState("");
  const [photoPage, setPhotoPage] = useState(1);
  const [photoTotalPages, setPhotoTotalPages] = useState(1);
  const [photoTotalCount, setPhotoTotalCount] = useState(0);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [isBatchActionLoading, setIsBatchActionLoading] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  // Bulk Upload State with Batching (groups of 10)
  const BATCH_SIZE = 10;
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isPublicUpload, setIsPublicUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadBatchProgress, setUploadBatchProgress] = useState<BatchProgressInfo>({
    isActive: false,
    totalFiles: 0,
    totalBatches: 0,
    currentBatchIndex: 0,
    currentBatchFiles: [],
    processedFiles: 0,
    successfulCount: 0,
    failedCount: 0,
    percentage: 0,
    statusMessage: "",
  });
  const [failedUploads, setFailedUploads] = useState<UploadFailureItem[]>([]);
  const [showFailedDetails, setShowFailedDetails] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadPhotos = useCallback(async () => {
    if (!event) return;
    setIsLoadingPhotos(true);
    setErrorMsg("");
    try {
      const res = await fetchEventPhotos(
        {
          event_id: event.id,
          search: photoSearch.trim() || undefined,
          page: photoPage,
          page_size: 16,
        },
        session?.tokens.access_token
      );

      setPhotos(res.items || []);
      setPhotoTotalPages(res.total_pages || 1);
      setPhotoTotalCount(res.total || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Could not load photos: ${msg}`);
    } finally {
      setIsLoadingPhotos(false);
    }
  }, [event, photoSearch, photoPage, session?.tokens.access_token]);

  useEffect(() => {
    if (isOpen && event && activeTab === "photos") {
      loadPhotos();
    }
  }, [isOpen, event, activeTab, loadPhotos]);

  const handleToggleSelectPhoto = (photoId: string) => {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  };

  const handleSelectAllPhotos = () => {
    if (selectedPhotoIds.size === photos.length) {
      setSelectedPhotoIds(new Set());
    } else {
      setSelectedPhotoIds(new Set(photos.map((p) => p.id)));
    }
  };

  const handleTogglePhotoVisibility = async (photo: PhotoItem) => {
    if (!event) return;
    const targetState = !photo.is_public;
    try {
      await updatePhotoVisibility(
        photo.id,
        targetState,
        session?.tokens.access_token,
        event.id
      );
      setPhotos((prev) =>
        prev.map((p) => (p.id === photo.id ? { ...p, is_public: targetState } : p))
      );
      setSuccessMsg(`Photo visibility updated to ${targetState ? "Public" : "Private"}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Failed to change visibility: ${msg}`);
    }
  };

  const handleDeleteSinglePhoto = async (photoId: string) => {
    if (!event) return;
    if (!confirm("Are you sure you want to delete this photo permanently?")) return;
    try {
      await deletePhoto(photoId, session?.tokens.access_token, event.id);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      setSelectedPhotoIds((prev) => {
        const next = new Set(prev);
        next.delete(photoId);
        return next;
      });
      setSuccessMsg("Photo deleted successfully.");
      onRefreshEvents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Failed to delete photo: ${msg}`);
    }
  };

  const handleBatchUpdateVisibility = async (isPublic: boolean) => {
    if (!event || selectedPhotoIds.size === 0) return;
    setIsBatchActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    const ids = Array.from(selectedPhotoIds);
    try {
      await batchUpdatePhotosVisibility(
        ids,
        isPublic,
        session?.tokens.access_token,
        event.id
      );
      setPhotos((prev) =>
        prev.map((p) => (selectedPhotoIds.has(p.id) ? { ...p, is_public: isPublic } : p))
      );
      setSuccessMsg(`Updated ${ids.length} photo(s) to ${isPublic ? "Public" : "Private"}.`);
      setSelectedPhotoIds(new Set());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Batch visibility update failed: ${msg}`);
    } finally {
      setIsBatchActionLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (!event || selectedPhotoIds.size === 0) return;
    const count = selectedPhotoIds.size;
    if (!confirm(`Are you sure you want to delete ${count} selected photo(s) permanently?`))
      return;

    setIsBatchActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    const ids = Array.from(selectedPhotoIds);
    try {
      await batchDeletePhotos(ids, session?.tokens.access_token, event.id);
      setPhotos((prev) => prev.filter((p) => !selectedPhotoIds.has(p.id)));
      setSelectedPhotoIds(new Set());
      setSuccessMsg(`Deleted ${count} photo(s) successfully.`);
      onRefreshEvents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Batch deletion failed: ${msg}`);
    } finally {
      setIsBatchActionLoading(false);
    }
  };

  // Bulk Upload logic with Batches of 10
  const handleStopUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const runBatchUpload = async (filesToUpload: File[]) => {
    if (!event || filesToUpload.length === 0) return;

    const totalFiles = filesToUpload.length;
    const totalBatches = Math.ceil(totalFiles / BATCH_SIZE);

    setIsUploading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let successfulTotal = 0;
    let failedTotal = 0;
    const currentRunFailures: UploadFailureItem[] = [];

    setUploadBatchProgress({
      isActive: true,
      totalFiles,
      totalBatches,
      currentBatchIndex: 0,
      currentBatchFiles: [],
      processedFiles: 0,
      successfulCount: 0,
      failedCount: 0,
      percentage: 0,
      statusMessage: `Initializing upload of ${totalFiles.toLocaleString()} photo(s) in ${totalBatches.toLocaleString()} batch(es) of ${BATCH_SIZE}...`,
    });

    for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
      if (abortController.signal.aborted) {
        break;
      }

      const startIdx = batchIdx * BATCH_SIZE;
      const endIdx = Math.min(startIdx + BATCH_SIZE, totalFiles);
      const batchFiles = filesToUpload.slice(startIdx, endIdx);

      setUploadBatchProgress((prev) => ({
        ...prev,
        currentBatchIndex: batchIdx + 1,
        currentBatchFiles: batchFiles.map((f) => f.name),
        statusMessage: `Uploading batch ${batchIdx + 1} of ${totalBatches} (Photos ${startIdx + 1} - ${endIdx} of ${totalFiles})...`,
      }));

      try {
        const response = await uploadPhotosBulk(
          event.id,
          batchFiles,
          isPublicUpload,
          session?.tokens.access_token,
          abortController.signal
        );

        if (response && response.success) {
          const batchSuccess = response.data?.successful ?? batchFiles.length;
          const batchFailed = response.data?.failed ?? 0;
          successfulTotal += batchSuccess;

          if (batchFailed > 0) {
            failedTotal += batchFailed;
            const serverErrors: string[] = Array.isArray(response.data?.errors)
              ? response.data.errors.map(String)
              : [];

            batchFiles.forEach((file, fIdx) => {
              const matchedError = serverErrors.find((e) =>
                e.toLowerCase().includes(file.name.toLowerCase())
              );
              const photoRecord = response.data?.photos?.find(
                (p) => p.original_filename === file.name
              );

              if (photoRecord?.processing_status === "failed" || matchedError) {
                currentRunFailures.push({
                  id: `${file.name}-${batchIdx}-${fIdx}-${Date.now()}`,
                  fileName: file.name,
                  fileSize: file.size,
                  batchNumber: batchIdx + 1,
                  reason: matchedError || "Server photo processing failed",
                  file,
                  failedAt: new Date().toLocaleTimeString(),
                });
              } else if (fIdx >= batchSuccess && !photoRecord) {
                currentRunFailures.push({
                  id: `${file.name}-${batchIdx}-${fIdx}-${Date.now()}`,
                  fileName: file.name,
                  fileSize: file.size,
                  batchNumber: batchIdx + 1,
                  reason: serverErrors[fIdx] || "Upload rejected by server",
                  file,
                  failedAt: new Date().toLocaleTimeString(),
                });
              }
            });
          }
        } else {
          const failMsg = response?.message || "Batch upload failed on server";
          failedTotal += batchFiles.length;
          batchFiles.forEach((file, fIdx) => {
            currentRunFailures.push({
              id: `${file.name}-${batchIdx}-${fIdx}-${Date.now()}`,
              fileName: file.name,
              fileSize: file.size,
              batchNumber: batchIdx + 1,
              reason: failMsg,
              file,
              failedAt: new Date().toLocaleTimeString(),
            });
          });
        }
      } catch (err: unknown) {
        if (abortController.signal.aborted) {
          break;
        }
        const msg = err instanceof Error ? err.message : String(err);
        failedTotal += batchFiles.length;
        batchFiles.forEach((file, fIdx) => {
          currentRunFailures.push({
            id: `${file.name}-${batchIdx}-${fIdx}-${Date.now()}`,
            fileName: file.name,
            fileSize: file.size,
            batchNumber: batchIdx + 1,
            reason: msg || "Network or server failure",
            file,
            failedAt: new Date().toLocaleTimeString(),
          });
        });
      }

      const processedSoFar = endIdx;
      const percent = Math.round((processedSoFar / totalFiles) * 100);

      setUploadBatchProgress((prev) => ({
        ...prev,
        processedFiles: processedSoFar,
        successfulCount: successfulTotal,
        failedCount: failedTotal,
        percentage: percent,
      }));

      if (currentRunFailures.length > 0) {
        setFailedUploads((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const added = currentRunFailures.filter((item) => !existingIds.has(item.id));
          return [...prev, ...added];
        });
      }

      // Small 80ms delay between batches for browser event loop & network scheduling
      await new Promise((resolve) => setTimeout(resolve, 80));
    }

    const wasAborted = abortController.signal.aborted;
    setIsUploading(false);
    abortControllerRef.current = null;

    setUploadBatchProgress((prev) => ({
      ...prev,
      isActive: false,
      percentage: wasAborted ? prev.percentage : 100,
      statusMessage: wasAborted
        ? `Upload stopped: ${successfulTotal} successful, ${failedTotal} failed.`
        : `Upload finished: ${successfulTotal} successful, ${failedTotal} failed.`,
    }));

    if (wasAborted) {
      setSuccessMsg(
        `Upload stopped by user. ${successfulTotal} photo(s) uploaded successfully, ${failedTotal} failed.`
      );
    } else if (failedTotal === 0) {
      setSuccessMsg(
        `Successfully uploaded all ${successfulTotal.toLocaleString()} photo(s) in batches of ${BATCH_SIZE}!`
      );
      setSelectedFiles([]);
    } else {
      setErrorMsg(
        `Batch upload finished with ${failedTotal} error(s) out of ${totalFiles}. Detailed error log and retry options are below.`
      );
      setSelectedFiles((prev) =>
        prev.filter((f) => currentRunFailures.some((cf) => cf.fileName === f.name))
      );
    }

    loadPhotos();
    onRefreshEvents();
  };

  const handleBulkUpload = async () => {
    if (selectedFiles.length === 0) return;
    await runBatchUpload(selectedFiles);
  };

  const handleRetryAllFailed = async () => {
    if (failedUploads.length === 0) return;
    const retryFiles = failedUploads.map((item) => item.file);
    setFailedUploads([]);
    await runBatchUpload(retryFiles);
  };

  const handleRetrySingleFailed = async (item: UploadFailureItem) => {
    setFailedUploads((prev) => prev.filter((p) => p.id !== item.id));
    await runBatchUpload([item.file]);
  };

  const handleDismissFailed = () => {
    setFailedUploads([]);
  };

  // ==========================================
  // TAB 3: Restricted Faces State
  // ==========================================
  const [restrictedFaces, setRestrictedFaces] = useState<RestrictedFace[]>([]);
  const [isLoadingRestricted, setIsLoadingRestricted] = useState(false);
  const [showAddRestricted, setShowAddRestricted] = useState(false);
  const [restrictMode, setRestrictMode] = useState<"upload" | "face_id">("upload");
  const [restrictPhotoFile, setRestrictPhotoFile] = useState<File | null>(null);
  const [restrictPhotoPreview, setRestrictPhotoPreview] = useState<string | null>(null);
  const [restrictFaceId, setRestrictFaceId] = useState("");
  const [restrictName, setRestrictName] = useState("");
  const [restrictReason, setRestrictReason] = useState("Selfie search opt-out");
  const [isSubmittingRestricted, setIsSubmittingRestricted] = useState(false);

  const loadRestrictedFaces = useCallback(async () => {
    if (!event) return;
    setIsLoadingRestricted(true);
    setErrorMsg("");
    try {
      const list = await listRestrictedFaces(event.id, session?.tokens.access_token);
      setRestrictedFaces(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Could not load restricted faces: ${msg}`);
    } finally {
      setIsLoadingRestricted(false);
    }
  }, [event, session?.tokens.access_token]);

  useEffect(() => {
    if (isOpen && event && activeTab === "restricted") {
      loadRestrictedFaces();
    }
  }, [isOpen, event, activeTab, loadRestrictedFaces]);

  const handleAddRestriction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    if (!restrictName.trim()) {
      setErrorMsg("Please provide the person's name.");
      return;
    }

    setIsSubmittingRestricted(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (restrictMode === "upload") {
        if (!restrictPhotoFile) {
          setErrorMsg("Please select a photo file of the person to restrict.");
          setIsSubmittingRestricted(false);
          return;
        }
        await restrictFaceViaUpload(
          event.id,
          restrictPhotoFile,
          restrictName.trim(),
          restrictReason.trim(),
          session?.tokens.access_token
        );
      } else {
        if (!restrictFaceId.trim()) {
          setErrorMsg("Please provide the detected face UUID.");
          setIsSubmittingRestricted(false);
          return;
        }
        await restrictFaceFromDetectedFace(
          event.id,
          restrictFaceId.trim(),
          restrictName.trim(),
          restrictReason.trim(),
          session?.tokens.access_token
        );
      }

      setSuccessMsg(`Face restriction for "${restrictName.trim()}" added successfully.`);
      setShowAddRestricted(false);
      setRestrictPhotoFile(null);
      setRestrictPhotoPreview(null);
      setRestrictFaceId("");
      setRestrictName("");
      loadRestrictedFaces();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Failed to add face restriction: ${msg}`);
    } finally {
      setIsSubmittingRestricted(false);
    }
  };

  const handleDeleteRestriction = async (restrictedFaceId: string, name: string) => {
    if (!event) return;
    if (!confirm(`Are you sure you want to remove the restriction for "${name}"?`)) return;

    try {
      await deleteRestrictedFace(event.id, restrictedFaceId, session?.tokens.access_token);
      setRestrictedFaces((prev) => prev.filter((r) => r.id !== restrictedFaceId));
      setSuccessMsg(`Restriction for "${name}" removed. Selfie search re-enabled.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Failed to remove restriction: ${msg}`);
    }
  };

  // ==========================================
  // TAB 4: Processing Status State
  // ==========================================
  const [statusData, setStatusData] = useState<ProcessingStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadStatus = useCallback(async () => {
    if (!event) return;
    setIsLoadingStatus(true);
    try {
      const res = await getProcessingStatus(event.id, session?.tokens.access_token);
      if (res.success && res.data) {
        setStatusData(res.data);
      }
    } catch (err) {
      console.error("Error loading status:", err);
    } finally {
      setIsLoadingStatus(false);
    }
  }, [event, session?.tokens.access_token]);

  useEffect(() => {
    if (isOpen && event && activeTab === "status") {
      loadStatus();
    }
  }, [isOpen, event, activeTab, loadStatus]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh && isOpen && event && activeTab === "status") {
      interval = setInterval(() => {
        loadStatus();
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, isOpen, event, activeTab, loadStatus]);

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-7 relative max-h-[92vh] flex flex-col overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase font-semibold tracking-wider text-indigo-400">
                Event Command Center
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 mb-4 overflow-x-auto gap-2">
          <button
            onClick={() => {
              setActiveTab("photos");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`flex items-center gap-2 pb-3 px-3.5 text-xs font-semibold whitespace-nowrap transition border-b-2 ${
              activeTab === "photos"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Manage Photos ({photoTotalCount || event.photo_count || 0})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("restricted");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`flex items-center gap-2 pb-3 px-3.5 text-xs font-semibold whitespace-nowrap transition border-b-2 ${
              activeTab === "restricted"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <UserX className="w-4 h-4 text-amber-400" />
            <span>Restricted Faces ({restrictedFaces.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("details");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`flex items-center gap-2 pb-3 px-3.5 text-xs font-semibold whitespace-nowrap transition border-b-2 ${
              activeTab === "details"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Event Details</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("status");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`flex items-center gap-2 pb-3 px-3.5 text-xs font-semibold whitespace-nowrap transition border-b-2 ${
              activeTab === "status"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Processing Status</span>
          </button>
        </div>

        {/* Global Notifications */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg("")} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg("")} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: MANAGE PHOTOS (Gallery, Search, Batch & Upload)     */}
        {/* ========================================================= */}
        {activeTab === "photos" && (
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={photoSearch}
                  onChange={(e) => {
                    setPhotoSearch(e.target.value);
                    setPhotoPage(1);
                  }}
                  placeholder="Search photos by filename..."
                  className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Actions & Uploader Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowUploader(!showUploader)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                    showUploader
                      ? "bg-slate-800 text-slate-200 border border-slate-700"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{showUploader ? "Hide Uploader" : "Upload Photos"}</span>
                </button>

                <button
                  onClick={loadPhotos}
                  disabled={isLoadingPhotos}
                  title="Refresh photo list"
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-indigo-400 ${
                      isLoadingPhotos ? "animate-spin" : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Embedded Uploader Panel if toggled */}
            {showUploader && (
              <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/20 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Bulk Upload Photographs (Batches of 10)</span>
                  </h4>
                  <button
                    onClick={() => setShowUploader(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-900/40 hover:bg-slate-900 transition">
                  <Upload className="w-6 h-6 text-indigo-400 mb-1.5" />
                  <span className="text-xs font-semibold text-slate-200">
                    Select photo files to upload
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    Select any quantity (e.g. 100 to 1,000+ photos). Uploads automatically run in batches of 10.
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) {
                        setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                      }
                    }}
                    className="hidden"
                  />
                </label>

                {selectedFiles.length > 0 && (
                  <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Layers className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-white">
                          {selectedFiles.length.toLocaleString()} photo(s) queued
                        </span>
                        <span className="text-slate-400 ml-1.5">
                          ({formatBytes(selectedFiles.reduce((acc, f) => acc + f.size, 0))} total)
                        </span>
                        <p className="text-[11px] text-indigo-300/80 mt-0.5">
                          ⚡ Will be uploaded sequentially in{" "}
                          <span className="font-semibold text-indigo-200">
                            {Math.ceil(selectedFiles.length / BATCH_SIZE).toLocaleString()} batch(es)
                          </span>{" "}
                          of 10 photos
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedFiles([])}
                      disabled={isUploading}
                      className="text-rose-400 hover:text-rose-300 font-medium hover:underline disabled:opacity-50"
                    >
                      Clear Selection
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isPublicUpload}
                      onChange={(e) => setIsPublicUpload(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-indigo-600"
                    />
                    <span>Mark as Public Photos</span>
                  </label>

                  <button
                    onClick={handleBulkUpload}
                    disabled={selectedFiles.length === 0 || isUploading}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>
                          Batch {uploadBatchProgress.currentBatchIndex} / {uploadBatchProgress.totalBatches}
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>
                          Upload {selectedFiles.length > 0 ? `${selectedFiles.length.toLocaleString()} Photos` : "Photos"}
                          {selectedFiles.length > 0 && ` (${Math.ceil(selectedFiles.length / BATCH_SIZE)} Batches)`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Live Batch Upload Progress Dashboard */}
            {(isUploading || uploadBatchProgress.processedFiles > 0) && (
              <div className="p-4 rounded-xl bg-slate-950/90 border border-indigo-500/30 shadow-lg space-y-3 animate-in fade-in duration-150">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {isUploading ? (
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
                      </span>
                    ) : uploadBatchProgress.failedCount === 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Batch Upload Progress</span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold">
                          Batch {uploadBatchProgress.currentBatchIndex} of {uploadBatchProgress.totalBatches}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        {uploadBatchProgress.statusMessage}
                      </p>
                    </div>
                  </div>

                  {isUploading && (
                    <button
                      onClick={handleStopUpload}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <StopCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Stop Upload</span>
                    </button>
                  )}
                </div>

                {/* Progress Bar with Percentage */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      {uploadBatchProgress.processedFiles.toLocaleString()} /{" "}
                      {uploadBatchProgress.totalFiles.toLocaleString()} photos processed
                    </span>
                    <span className="font-bold text-indigo-300 font-mono">
                      {uploadBatchProgress.percentage}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        uploadBatchProgress.failedCount > 0
                          ? "bg-gradient-to-r from-indigo-500 via-amber-500 to-emerald-500"
                          : "bg-gradient-to-r from-indigo-500 to-emerald-400"
                      }`}
                      style={{ width: `${uploadBatchProgress.percentage}%` }}
                    />
                  </div>
                </div>

                {/* 4 Metrics Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 flex flex-col">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Total Queued</span>
                    <span className="text-sm font-bold text-white mt-0.5">
                      {uploadBatchProgress.totalFiles.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {uploadBatchProgress.totalBatches} batch(es)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 flex flex-col">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Current Batch</span>
                    <span className="text-sm font-bold text-indigo-300 mt-0.5 font-mono">
                      {uploadBatchProgress.currentBatchIndex} / {uploadBatchProgress.totalBatches}
                    </span>
                    <span className="text-[10px] text-indigo-400/80">
                      {uploadBatchProgress.currentBatchIndex > 0
                        ? `Photos ${((uploadBatchProgress.currentBatchIndex - 1) * BATCH_SIZE) + 1} - ${Math.min(
                            uploadBatchProgress.currentBatchIndex * BATCH_SIZE,
                            uploadBatchProgress.totalFiles
                          )}`
                        : "Ready"}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/30 flex flex-col">
                    <span className="text-[10px] uppercase font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Successful
                    </span>
                    <span className="text-sm font-bold text-emerald-300 mt-0.5 font-mono">
                      {uploadBatchProgress.successfulCount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-500/80">
                      {uploadBatchProgress.totalFiles > 0
                        ? `${Math.round((uploadBatchProgress.successfulCount / uploadBatchProgress.totalFiles) * 100)}% of total`
                        : "0%"}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/30 flex flex-col">
                    <span className="text-[10px] uppercase font-semibold text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-2.5 h-2.5" /> Failed
                    </span>
                    <span className="text-sm font-bold text-rose-300 mt-0.5 font-mono">
                      {uploadBatchProgress.failedCount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-rose-500/80">
                      {uploadBatchProgress.failedCount > 0 ? "Review errors below" : "None"}
                    </span>
                  </div>
                </div>

                {/* Active in-flight files list */}
                {isUploading && uploadBatchProgress.currentBatchFiles.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                        <Upload className="w-3 h-3 text-indigo-400 animate-pulse" />
                        Transmitting Batch #{uploadBatchProgress.currentBatchIndex} (
                        {uploadBatchProgress.currentBatchFiles.length} photos):
                      </span>
                      <span className="text-[10px] text-slate-500">10 photos / batch</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
                      {uploadBatchProgress.currentBatchFiles.map((fileName, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/60 truncate max-w-[190px] flex items-center gap-1"
                          title={fileName}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse flex-shrink-0" />
                          <span className="truncate">{fileName}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Detailed Failed Uploads Section & Retry Toolbar */}
            {failedUploads.length > 0 && (
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/40 space-y-3 shadow-lg animate-in fade-in duration-150">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-rose-200 flex items-center gap-2">
                        <span>{failedUploads.length.toLocaleString()} Photo(s) Failed to Upload</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono">
                          Action Required
                        </span>
                      </h4>
                      <p className="text-[11px] text-rose-300/80">
                        Review individual failure reasons below or retry all failed photos in batches of 10.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRetryAllFailed}
                      disabled={isUploading}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-rose-900/30 transition disabled:opacity-50"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isUploading ? "animate-spin" : ""}`} />
                      <span>Retry All Failed ({failedUploads.length})</span>
                    </button>

                    <button
                      onClick={() => setShowFailedDetails(!showFailedDetails)}
                      className="p-1.5 rounded-lg bg-slate-900 border border-rose-900/40 text-rose-300 hover:text-white transition"
                      title={showFailedDetails ? "Collapse error list" : "Expand error list"}
                    >
                      {showFailedDetails ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={handleDismissFailed}
                      disabled={isUploading}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition disabled:opacity-50"
                      title="Dismiss failed photos list"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Collapsible list of failed photos */}
                {showFailedDetails && (
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 text-xs">
                    {failedUploads.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-lg bg-slate-900/90 border border-rose-900/50 flex items-center justify-between gap-3 hover:border-rose-500/40 transition"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <FileWarning className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-slate-200 truncate max-w-[240px]">
                                {item.fileName}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                                {formatBytes(item.fileSize)}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800/40 font-mono">
                                Batch #{item.batchNumber}
                              </span>
                              <span className="text-[10px] text-slate-500">{item.failedAt}</span>
                            </div>
                            <p className="text-[11px] text-rose-300/90 mt-1 font-mono break-all bg-rose-950/40 p-1 rounded border border-rose-900/30">
                              {item.reason}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRetrySingleFailed(item)}
                          disabled={isUploading}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-[11px] font-medium flex items-center gap-1 transition flex-shrink-0 disabled:opacity-50"
                          title="Retry uploading this single photo"
                        >
                          <RotateCw className="w-3 h-3 text-indigo-400" />
                          <span>Retry</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Batch Actions Toolbar (if selections exist) */}
            {selectedPhotoIds.size > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs animate-in fade-in duration-150">
                <span className="text-indigo-300 font-semibold px-2">
                  {selectedPhotoIds.size} photo(s) selected
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBatchUpdateVisibility(true)}
                    disabled={isBatchActionLoading}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-medium transition flex items-center gap-1.5"
                  >
                    <Globe className="w-3 h-3 text-emerald-400" />
                    <span>Make Public</span>
                  </button>

                  <button
                    onClick={() => handleBatchUpdateVisibility(false)}
                    disabled={isBatchActionLoading}
                    className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 font-medium transition flex items-center gap-1.5"
                  >
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>Make Private</span>
                  </button>

                  <button
                    onClick={handleBatchDelete}
                    disabled={isBatchActionLoading}
                    className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-medium transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            )}

            {/* Select All Toggle Bar */}
            {photos.length > 0 && (
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <button
                  onClick={handleSelectAllPhotos}
                  className="flex items-center gap-1.5 hover:text-white transition"
                >
                  {selectedPhotoIds.size === photos.length && photos.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500" />
                  )}
                  <span>Select All ({photos.length})</span>
                </button>
                <span>
                  Showing page {photoPage} of {photoTotalPages} ({photoTotalCount} total photos)
                </span>
              </div>
            )}

            {/* Photos Grid */}
            <div className="flex-1 overflow-y-auto pr-1">
              {isLoadingPhotos ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 py-8">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <div
                      key={n}
                      className="aspect-[4/3] rounded-xl bg-slate-950 border border-slate-800 animate-pulse"
                    />
                  ))}
                </div>
              ) : photos.length === 0 ? (
                <div className="py-16 text-center rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3">
                  <ImageIcon className="w-10 h-10 text-slate-600 mx-auto" />
                  <h3 className="text-sm font-semibold text-slate-300">No photos found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {photoSearch
                      ? `No photos matched "${photoSearch}".`
                      : "No photos have been ingested for this event yet."}
                  </p>
                  <button
                    onClick={() => setShowUploader(true)}
                    className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload First Photo Batch</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {photos.map((photo) => {
                    const isSelected = selectedPhotoIds.has(photo.id);
                    const thumbUrl = getPhotoDirectThumbnailUrl(photo.id, event.id);

                    return (
                      <div
                        key={photo.id}
                        className={`group relative rounded-xl bg-slate-950 border overflow-hidden transition flex flex-col ${
                          isSelected
                            ? "border-indigo-500 ring-2 ring-indigo-500/30"
                            : "border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        {/* Thumbnail Viewport */}
                        <div className="relative aspect-[4/3] w-full bg-black/60 overflow-hidden">
                          <img
                            src={thumbUrl}
                            alt={photo.original_filename}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />

                          {/* Gradient Shade */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                          {/* Select Checkbox */}
                          <button
                            type="button"
                            onClick={() => handleToggleSelectPhoto(photo.id)}
                            className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white backdrop-blur-md transition z-10"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </button>

                          {/* Visibility Badge */}
                          <button
                            type="button"
                            onClick={() => handleTogglePhotoVisibility(photo)}
                            title={photo.is_public ? "Public (Click to make Private)" : "Private (Click to make Public)"}
                            className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 backdrop-blur-md transition ${
                              photo.is_public
                                ? "bg-emerald-500/80 hover:bg-emerald-500 text-white"
                                : "bg-amber-500/80 hover:bg-amber-500 text-white"
                            }`}
                          >
                            {photo.is_public ? (
                              <>
                                <Globe className="w-2.5 h-2.5" />
                                <span>Public</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-2.5 h-2.5" />
                                <span>Private</span>
                              </>
                            )}
                          </button>

                          {/* Action Overlay */}
                          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                            <button
                              type="button"
                              onClick={() => handleDeleteSinglePhoto(photo.id)}
                              title="Delete photo"
                              className="p-1.5 rounded-lg bg-black/80 text-rose-400 hover:bg-rose-500 hover:text-white transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Details Footer */}
                        <div className="p-2.5 text-[11px] space-y-0.5">
                          <p className="font-medium text-slate-200 truncate" title={photo.original_filename}>
                            {photo.original_filename}
                          </p>
                          <div className="flex items-center justify-between text-slate-500 font-mono text-[10px]">
                            <span>ID: {photo.id.substring(0, 8)}...</span>
                            {photo.face_count !== undefined && (
                              <span>{photo.face_count} face{photo.face_count === 1 ? "" : "s"}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {photoTotalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <button
                  onClick={() => setPhotoPage((p) => Math.max(1, p - 1))}
                  disabled={photoPage <= 1 || isLoadingPhotos}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <span className="text-slate-400">
                  Page {photoPage} of {photoTotalPages}
                </span>
                <button
                  onClick={() => setPhotoPage((p) => Math.min(photoTotalPages, p + 1))}
                  disabled={photoPage >= photoTotalPages || isLoadingPhotos}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: RESTRICTED FACES (Privacy Opt-out & VIP Exclusions) */}
        {/* ========================================================= */}
        {activeTab === "restricted" && (
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            {/* Header / Intro */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                  <UserX className="w-4 h-4 text-amber-400" />
                  <span>Facial Search Restrictions (Opt-out)</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-xl">
                  Photos matching these individuals are blocked from being returned in attendee selfie
                  searches, ensuring strict privacy protection for VIPs or opt-out requests.
                </p>
              </div>

              <button
                onClick={() => setShowAddRestricted(!showAddRestricted)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow flex items-center gap-1.5 transition shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{showAddRestricted ? "Cancel" : "Add Face Restriction"}</span>
              </button>
            </div>

            {/* Add Restriction Form Panel */}
            {showAddRestricted && (
              <form
                onSubmit={handleAddRestriction}
                className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-3 animate-in fade-in duration-150"
              >
                <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800 w-fit">
                  <button
                    type="button"
                    onClick={() => setRestrictMode("upload")}
                    className={`px-3 py-1 rounded text-xs font-medium transition ${
                      restrictMode === "upload"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Upload Photo of Person
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestrictMode("face_id")}
                    className={`px-3 py-1 rounded text-xs font-medium transition ${
                      restrictMode === "face_id"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Use Detected Face ID
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Person Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={restrictName}
                      onChange={(e) => setRestrictName(e.target.value)}
                      placeholder="e.g. John Doe / VIP Speaker"
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Reason for Restriction
                    </label>
                    <input
                      type="text"
                      value={restrictReason}
                      onChange={(e) => setRestrictReason(e.target.value)}
                      placeholder="e.g. Selfie search opt-out / Privacy request"
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {restrictMode === "upload" ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Photo of the Person <span className="text-rose-400">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setRestrictPhotoFile(file);
                            setRestrictPhotoPreview(URL.createObjectURL(file));
                          }
                        }}
                        className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
                      />
                      {restrictPhotoPreview && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700">
                          <img
                            src={restrictPhotoPreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Face UUID <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={restrictFaceId}
                      onChange={(e) => setRestrictFaceId(e.target.value)}
                      placeholder="e.g. 1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d"
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddRestricted(false)}
                    className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRestricted}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition disabled:opacity-50"
                  >
                    {isSubmittingRestricted ? "Saving..." : "Apply Face Restriction"}
                  </button>
                </div>
              </form>
            )}

            {/* List of Restricted Faces */}
            <div className="flex-1 overflow-y-auto pr-1">
              {isLoadingRestricted ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  Loading restricted faces list...
                </div>
              ) : restrictedFaces.length === 0 ? (
                <div className="py-16 text-center rounded-2xl bg-slate-950/40 border border-slate-800 space-y-2">
                  <UserX className="w-9 h-9 text-slate-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-300">No faces restricted yet</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    All attendees can search and discover their photos. Add an opt-out restriction
                    if an attendee or speaker requests privacy.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {restrictedFaces.map((item) => {
                    const thumbUrl = getRestrictedFaceThumbnailUrl(event.id, item.id);
                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                            <img
                              src={thumbUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                              }}
                            />
                            <UserX className="w-5 h-5 text-amber-400" />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-white truncate">{item.name}</p>
                            <p className="text-[10px] text-amber-400/90 truncate">
                              {item.reason || "Selfie search opt-out"}
                            </p>
                            <span className="text-[9px] text-slate-500 font-mono">
                              ID: {item.id.substring(0, 8)}...
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteRestriction(item.id, item.name)}
                          title="Remove restriction (allow selfie search again)"
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: EVENT DETAILS (Manage & Update All Event Details)   */}
        {/* ========================================================= */}
        {activeTab === "details" && (
          <form onSubmit={handleSaveEventDetails} className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Event Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. 💍 Vishnu ❤️ Deepanaashri | A Beautiful Beginning to Forever ✨"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    placeholder="e.g. vishnu-deepanaashri"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Description & Invitation Details
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Preserves line breaks, dates, and emojis
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="💍 Two Hearts, One Beautiful Journey! 💖&#10;&#10;With immense joy and happiness, we cordially invite you...&#10;📅 Date: Sunday, 22nd November 2026&#10;📍 Venue: Selvalakshmi Mahal, Namakkal."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500 resize-y font-sans leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Access Type
                  </label>
                  <select
                    value={editAccessType}
                    onChange={(e) => setEditAccessType(e.target.value as "public" | "private")}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="public">Public Event</option>
                    <option value="private">Private Event</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Event Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as "active" | "archived" | "draft")}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-500 space-y-1 font-mono">
                <p>Event UUID: {event.id}</p>
                <p>Organiser UUID: {event.organiser_id}</p>
                {event.created_at && <p>Created At: {new Date(event.created_at).toLocaleString()}</p>}
                {event.updated_at && <p>Updated At: {new Date(event.updated_at).toLocaleString()}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                disabled={isSavingDetails}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 disabled:opacity-50"
              >
                {isSavingDetails ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Event Details</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* TAB 4: PROCESSING STATUS (Indexing Metrics & Queue)       */}
        {/* ========================================================= */}
        {activeTab === "status" && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={loadStatus}
                  disabled={isLoadingStatus}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-indigo-400 ${
                      isLoadingStatus ? "animate-spin" : ""
                    }`}
                  />
                  <span>Refresh</span>
                </button>
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600"
                  />
                  <span>Auto-refresh (3.5s)</span>
                </label>
              </div>

              <span className="text-[11px] font-mono text-slate-500">
                Event: {event.id.substring(0, 12)}...
              </span>
            </div>

            {statusData ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Total Ingested</span>
                    <Layers className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mt-1">{statusData.total}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Completed & Indexed</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">
                    {statusData.completed}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">In Processing</span>
                    <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                  </div>
                  <p className="text-2xl font-bold text-cyan-400 mt-1">
                    {statusData.processing}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Pending Queue</span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-2xl font-bold text-amber-400 mt-1">{statusData.pending}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Failed</span>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  </div>
                  <p className="text-2xl font-bold text-rose-400 mt-1">{statusData.failed}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-center">
                  <span className="text-xs text-slate-400">Indexing Progress</span>
                  <div className="mt-2 w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${
                          statusData.total > 0
                            ? Math.round((statusData.completed / statusData.total) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-right text-slate-400 mt-1">
                    {statusData.total > 0
                      ? Math.round((statusData.completed / statusData.total) * 100)
                      : 100}
                    % Ready
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                Fetching photo processing status...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
