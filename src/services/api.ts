import {
  AuthResponse,
  BulkUploadResponse,
  ConsentResponse,
  CreateEventRequest,
  CreateEventResponse,
  EventItem,
  LoginRequest,
  PhotoItem,
  PhotosListResponse,
  ProcessingStatusResponse,
  RegisterRequest,
  RestrictedFace,
  SearchResponse,
  UpdateEventRequest,
} from "@/types/api";

const STORAGE_KEYS = {
  API_BASE_URL: "eventsnap_api_base_url",
  AUTH_SESSION: "eventsnap_auth_session",
};

export const DEFAULT_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:8001";

export function getStoredApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  if (typeof window === "undefined") return envUrl || DEFAULT_API_BASE;
  const stored = localStorage.getItem(STORAGE_KEYS.API_BASE_URL);
  if (stored && stored !== "http://localhost") {
    return stored;
  }
  return envUrl || DEFAULT_API_BASE;
}

export function setStoredApiBaseUrl(url: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.API_BASE_URL, url.replace(/\/+$/, ""));
  }
}

// Helper to handle API responses and errors
async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const errorMsg =
      (isJson && data?.message) ||
      (isJson && data?.detail) ||
      (typeof data === "string" && data.length > 0 ? data : `Request failed with status ${res.status}`);
    throw new Error(errorMsg);
  }

  return data as T;
}

// ==========================================
// 1. Auth APIs
// ==========================================

export async function registerOrganiser(data: RegisterRequest): Promise<AuthResponse> {
  const baseUrl = getStoredApiBaseUrl();
  const url = `${baseUrl}/api/v1/auth/register`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  return handleResponse<AuthResponse>(res);
}

export async function loginOrganiser(data: LoginRequest): Promise<AuthResponse> {
  const baseUrl = getStoredApiBaseUrl();
  const url = `${baseUrl}/api/v1/auth/login`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  return handleResponse<AuthResponse>(res);
}

// ==========================================
// 2. Events Management APIs
// ==========================================

export async function fetchEvents(): Promise<EventItem[]> {
  const baseUrl = getStoredApiBaseUrl();
  const url = `${baseUrl}/api/v1/events`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const json = await handleResponse<{
    success?: boolean;
    items?: EventItem[];
    data?: EventItem[] | { items?: EventItem[] };
  }>(res);

  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.items)) return json.items;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray((json?.data as any)?.items)) return (json?.data as any).items;
  return [];
}

export async function createEvent(
  eventData: CreateEventRequest,
  token?: string
): Promise<CreateEventResponse> {
  const baseUrl = getStoredApiBaseUrl();
  const url = `${baseUrl}/api/v1/events`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(eventData),
  });

  const json = await handleResponse<any>(res);
  const data = json?.data || json?.item || json;

  return {
    success: json?.success ?? true,
    message: json?.message || "Event created successfully",
    data,
  };
}

export async function updateEvent(
  eventId: string,
  eventData: UpdateEventRequest,
  token?: string
): Promise<EventItem> {
  const baseUrl = getStoredApiBaseUrl();
  const url = `${baseUrl}/api/v1/events/${eventId}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const payload: Record<string, any> = {
    name: eventData.name,
    description: eventData.description,
    access_type: eventData.access_type || "public",
    status: eventData.status || "active",
    event_date: eventData.event_date !== undefined ? eventData.event_date : null,
  };
  if (eventData.slug) {
    payload.slug = eventData.slug;
  }

  let res = await fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });

  if (res.status === 405 || res.status === 404) {
    res = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });
  }

  const json = await handleResponse<any>(res);
  return json?.data || json?.item || json;
}

// ==========================================
// 3. Photo Management & Ingestion APIs
// ==========================================

export async function uploadPhotosBulk(
  eventId: string,
  files: File[],
  isPublic: boolean,
  token?: string,
  signal?: AbortSignal
): Promise<BulkUploadResponse> {
  const baseUrl = getStoredApiBaseUrl();
  const url = `${baseUrl}/api/v1/events/${eventId}/photos/bulk`;

  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  formData.append("is_public", String(isPublic));

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
    signal,
  });

  return handleResponse<BulkUploadResponse>(res);
}

export async function getProcessingStatus(
  eventId: string,
  token?: string
): Promise<ProcessingStatusResponse> {
  const baseUrl = getStoredApiBaseUrl();
  const url = `${baseUrl}/api/v1/events/${eventId}/photos/processing-status`;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: "GET",
    headers,
  });

  return handleResponse<ProcessingStatusResponse>(res);
}

export async function fetchEventPhotos(
  params: { event_id?: string; search?: string; page?: number; page_size?: number },
  token?: string
): Promise<PhotosListResponse> {
  const baseUrl = getStoredApiBaseUrl();
  const query = new URLSearchParams();
  if (params.event_id) query.set("event_id", params.event_id);
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", String(params.page));
  if (params.page_size) query.set("page_size", String(params.page_size));

  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let url = `${baseUrl}/api/v1/photos?${query.toString()}`;
  let res = await fetch(url, { method: "GET", headers });

  if (res.status === 404 && params.event_id) {
    url = `${baseUrl}/api/v1/events/${params.event_id}/photos?${query.toString()}`;
    res = await fetch(url, { method: "GET", headers });
  }

  const json = await handleResponse<any>(res);
  const items =
    json?.items ||
    json?.photos ||
    json?.data?.items ||
    json?.data?.photos ||
    (Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []);

  return {
    success: json?.success ?? true,
    items,
    total: json?.total ?? items.length,
    page: json?.page ?? (params.page || 1),
    page_size: json?.page_size ?? (params.page_size || 20),
    total_pages:
      json?.total_pages ??
      Math.max(1, Math.ceil((json?.total || items.length) / (params.page_size || 20))),
    has_next: json?.has_next ?? false,
    has_prev: json?.has_prev ?? false,
  };
}

export async function getPhotoById(photoId: string, token?: string): Promise<PhotoItem> {
  const baseUrl = getStoredApiBaseUrl();
  const url = `${baseUrl}/api/v1/photos/${photoId}`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { method: "GET", headers });
  const json = await handleResponse<any>(res);
  return json?.data || json?.photo || json;
}

export async function updatePhotoVisibility(
  photoId: string,
  isPublic: boolean,
  token?: string,
  eventId?: string
): Promise<any> {
  const baseUrl = getStoredApiBaseUrl();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let url = `${baseUrl}/api/v1/photos/${photoId}`;
  let res = await fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ is_public: isPublic }),
  });

  if (res.status === 404 && eventId) {
    url = `${baseUrl}/api/v1/events/${eventId}/photos/${photoId}`;
    res = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ is_public: isPublic }),
    });
  }

  return handleResponse<any>(res);
}

export async function deletePhoto(photoId: string, token?: string, eventId?: string): Promise<any> {
  const baseUrl = getStoredApiBaseUrl();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let url = `${baseUrl}/api/v1/photos/${photoId}`;
  let res = await fetch(url, { method: "DELETE", headers });

  if (res.status === 404 && eventId) {
    url = `${baseUrl}/api/v1/events/${eventId}/photos/${photoId}`;
    res = await fetch(url, { method: "DELETE", headers });
  }

  return handleResponse<any>(res);
}

export async function batchUpdatePhotosVisibility(
  photoIds: string[],
  isPublic: boolean,
  token?: string,
  eventId?: string
): Promise<any> {
  const baseUrl = getStoredApiBaseUrl();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let url = `${baseUrl}/api/v1/photos/batch-update`;
  let res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ photo_ids: photoIds, is_public: isPublic }),
  });

  if (res.status === 404 && eventId) {
    url = `${baseUrl}/api/v1/events/${eventId}/photos/batch-update`;
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ photo_ids: photoIds, is_public: isPublic }),
    });
  }

  return handleResponse<any>(res);
}

export async function batchDeletePhotos(
  photoIds: string[],
  token?: string,
  eventId?: string
): Promise<any> {
  const baseUrl = getStoredApiBaseUrl();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let url = `${baseUrl}/api/v1/photos/batch-delete`;
  let res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ photo_ids: photoIds }),
  });

  if (res.status === 404 && eventId) {
    url = `${baseUrl}/api/v1/events/${eventId}/photos/batch-delete`;
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ photo_ids: photoIds }),
    });
  }

  return handleResponse<any>(res);
}

// ==========================================
// 4. Restricted Faces APIs (Privacy Opt-out)
// ==========================================

export async function listRestrictedFaces(
  eventId: string,
  token?: string
): Promise<RestrictedFace[]> {
  const baseUrl = getStoredApiBaseUrl();
  const url = `${baseUrl}/api/v1/events/${eventId}/restricted-faces`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { method: "GET", headers });
  const json = await handleResponse<any>(res);
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.items)) return json.items;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray((json?.data as any)?.items)) return (json?.data as any).items;
  return [];
}

export async function restrictFaceViaUpload(
  eventId: string,
  photo: File | Blob,
  name: string,
  reason?: string,
  token?: string
): Promise<any> {
  const baseUrl = getStoredApiBaseUrl();
  const url = `${baseUrl}/api/v1/events/${eventId}/restricted-faces`;

  const formData = new FormData();
  formData.append("photo", photo);
  formData.append("name", name);
  if (reason) formData.append("reason", reason);

  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  return handleResponse<any>(res);
}

export async function restrictFaceFromDetectedFace(
  eventId: string,
  faceId: string,
  name: string,
  reason?: string,
  token?: string
): Promise<any> {
  const baseUrl = getStoredApiBaseUrl();
  const url = `${baseUrl}/api/v1/events/${eventId}/restricted-faces/from-face/${faceId}`;

  const formData = new FormData();
  formData.append("name", name);
  if (reason) formData.append("reason", reason);

  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  return handleResponse<any>(res);
}

export async function deleteRestrictedFace(
  eventId: string,
  restrictedFaceId: string,
  token?: string
): Promise<any> {
  const baseUrl = getStoredApiBaseUrl();
  const url = `${baseUrl}/api/v1/events/${eventId}/restricted-faces/${restrictedFaceId}`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { method: "DELETE", headers });
  return handleResponse<any>(res);
}

export function getRestrictedFaceThumbnailUrl(
  eventId: string,
  restrictedFaceId: string,
  token?: string
): string {
  const baseUrl = getStoredApiBaseUrl();
  return `${baseUrl}/api/v1/events/${eventId}/restricted-faces/${restrictedFaceId}/thumbnail`;
}

// ==========================================
// 5. Attendee Facial Recognition Search APIs
// ==========================================

export async function recordConsent(
  eventId: string,
  purpose: string = "facial_recognition_search"
): Promise<ConsentResponse> {
  const baseUrl = getStoredApiBaseUrl();
  const url = `${baseUrl}/api/v1/events/${eventId}/search/consent`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      consent_given: true,
      purpose,
    }),
  });

  return handleResponse<ConsentResponse>(res);
}

export async function searchPhotosWithSelfie(
  eventId: string,
  selfieBlobOrFile: Blob | File,
  sessionId: string
): Promise<SearchResponse> {
  const baseUrl = getStoredApiBaseUrl();
  const url = `${baseUrl}/api/v1/events/${eventId}/search`;

  const formData = new FormData();
  formData.append("selfie", selfieBlobOrFile);
  formData.append("session_id", sessionId);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: formData,
  });

  return handleResponse<SearchResponse>(res);
}

// ==========================================
// 6. Photo URLs Delivery
// ==========================================

export function getPhotoViewUrl(eventId: string, photoId: string, sessionId?: string): string {
  const baseUrl = getStoredApiBaseUrl();
  const sessionParam = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : "";
  return `${baseUrl}/api/v1/events/${eventId}/photos/${photoId}/view${sessionParam}`;
}

export function getPhotoThumbnailUrl(eventId: string, photoId: string, sessionId?: string): string {
  const baseUrl = getStoredApiBaseUrl();
  const sessionParam = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : "";
  return `${baseUrl}/api/v1/events/${eventId}/photos/${photoId}/thumbnail${sessionParam}`;
}

export function getPhotoDirectThumbnailUrl(photoId: string, eventId?: string): string {
  const baseUrl = getStoredApiBaseUrl();
  if (eventId) {
    return `${baseUrl}/api/v1/events/${eventId}/photos/${photoId}/thumbnail`;
  }
  return `${baseUrl}/api/v1/photos/${photoId}/thumbnail`;
}

export function getPhotoDirectViewUrl(photoId: string, eventId?: string): string {
  const baseUrl = getStoredApiBaseUrl();
  if (eventId) {
    return `${baseUrl}/api/v1/events/${eventId}/photos/${photoId}/view`;
  }
  return `${baseUrl}/api/v1/photos/${photoId}/view`;
}
