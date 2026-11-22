export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  role: 'organiser';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: AuthTokens;
}

export interface UserSession {
  email: string;
  fullName: string;
  role: string;
  tokens: AuthTokens;
}

export interface EventItem {
  id: string;
  organiser_id: string;
  name: string;
  slug?: string;
  description?: string;
  event_date?: string | null;
  access_type: 'public' | 'private';
  status: 'active' | 'archived' | 'draft';
  created_at?: string;
  updated_at?: string;
  photo_count?: number;
  cover_image?: string;
}

export interface EventsListResponse {
  success: boolean;
  items?: EventItem[];
  data?: EventItem[];
  total?: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
  has_next?: boolean;
  has_prev?: boolean;
}

export interface CreateEventRequest {
  name: string;
  description: string;
  access_type: 'public' | 'private';
  event_date?: string | null;
  slug?: string;
}

export interface UpdateEventRequest {
  name?: string;
  description?: string;
  access_type?: 'public' | 'private';
  status?: 'active' | 'archived' | 'draft';
  event_date?: string | null;
  slug?: string;
}

export interface CreateEventResponse {
  success: boolean;
  message: string;
  data: EventItem;
}

export interface PhotoFace {
  id: string;
  photo_id?: string;
  confidence?: number;
  bounding_box?: any;
}

export interface PhotoItem {
  id: string;
  event_id: string;
  original_filename: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  is_public: boolean;
  face_count?: number;
  url?: string;
  thumbnail_url?: string;
  created_at?: string;
  updated_at?: string;
  faces?: PhotoFace[];
}

export interface PhotosListResponse {
  success: boolean;
  items?: PhotoItem[];
  photos?: PhotoItem[];
  data?: PhotoItem[] | { items?: PhotoItem[]; photos?: PhotoItem[] };
  total?: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
  has_next?: boolean;
  has_prev?: boolean;
}

export interface BatchUpdateVisibilityRequest {
  photo_ids: string[];
  is_public: boolean;
}

export interface BatchDeletePhotosRequest {
  photo_ids: string[];
}

export interface RestrictedFace {
  id: string;
  event_id: string;
  name: string;
  reason?: string;
  face_id?: string;
  created_at?: string;
  thumbnail_url?: string;
}

export interface RestrictedFacesListResponse {
  success: boolean;
  items?: RestrictedFace[];
  data?: RestrictedFace[];
}

export interface BulkUploadResponse {
  success: boolean;
  message: string;
  data: {
    total_uploaded: number;
    successful: number;
    failed: number;
    photos: PhotoItem[];
    errors: string[];
  };
}

export interface ProcessingStatus {
  event_id: string;
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export interface ProcessingStatusResponse {
  success: boolean;
  data: ProcessingStatus;
}

export interface ConsentRequest {
  consent_given: boolean;
  purpose: string;
}

export interface ConsentSessionData {
  session_id: string;
  event_id: string;
  consent_purpose: string;
  status: string;
  expires_at: string;
}

export interface ConsentResponse {
  success: boolean;
  message: string;
  data: ConsentSessionData;
}

export interface SearchResultItem {
  photo: {
    id: string;
    event_id?: string;
    original_filename: string;
    is_public: boolean;
    face_count: number;
  };
  match_type: 'face_match' | 'public';
  similarity_score: number | null;
  detection_confidence: number | null;
}

export interface SearchResponseData {
  session_id: string;
  event_id: string;
  faces_detected_in_selfie: number;
  matched_count: number;
  public_count: number;
  total_returned: number;
  items: SearchResultItem[];
}

export interface SearchResponse {
  success: boolean;
  message: string;
  data: SearchResponseData;
}

