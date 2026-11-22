# cinigama-admin — Event Photo Finder & Organiser Portal

A modern React application built with TypeScript, Tailwind CSS, and Next.js implementing all features specified in the API reference:
1. **Browse All Events**: Explore public and private events with real-time search, access filters, and photo counters.
2. **Attendee Facial Recognition Search**:
   - **Consent Initialization**: Calls `POST /api/v1/events/:eventId/search/consent` to create a secure search session.
   - **Selfie Capture / Upload**: Attendees can upload a photo file or snap a live selfie directly using their webcam.
   - **Facial Matching**: Calls `POST /api/v1/events/:eventId/search` to retrieve matching photos with similarity percentage scores and face counts.
   - **Secure Photo Delivery**: Tokenized image viewing and thumbnail delivery via session IDs (`/photos/:id/view?session_id=...`).
3. **Organiser Authentication & Event Administration**:
   - **Organiser Registration & Login**: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`.
   - **Event Management**: Create (`POST /api/v1/events`), Update all event details (`PATCH /api/v1/events/{id}`).
   - **Photo Gallery & Ingestion**:
     - View & search photos: `GET /api/v1/photos?event_id={id}&search={query}&page={n}`.
     - Toggle visibility: `PATCH /api/v1/photos/{id}` (`{"is_public": true/false}`).
     - Delete individual photo: `DELETE /api/v1/photos/{id}`.
     - Batch update visibility: `POST /api/v1/photos/batch-update` (`photo_ids`, `is_public`).
     - Batch delete photos: `POST /api/v1/photos/batch-delete` (`photo_ids`).
     - Bulk upload: `POST /api/v1/events/{id}/photos/bulk`.
     - Processing status monitor: `GET /api/v1/events/{id}/photos/processing-status`.
   - **Restricted Faces (Privacy Opt-out & VIP Exclusions)**:
     - Restrict face via photo upload: `POST /api/v1/events/{id}/restricted-faces` (`photo`, `name`, `reason`).
     - Restrict face from detected face UUID: `POST /api/v1/events/{id}/restricted-faces/from-face/{face_id}`.
     - List restricted faces: `GET /api/v1/events/{id}/restricted-faces`.
     - Remove face restriction: `DELETE /api/v1/events/{id}/restricted-faces/{restricted_face_id}`.
     - View restricted thumbnail: `GET /api/v1/events/{id}/restricted-faces/{restricted_face_id}/thumbnail`.

---

## ⚙️ Environment Configuration

Create or update `.env` in the project root:

```env
# Target backend API base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost
```

An example template is provided in [.env.example](file:///Users/apple/.gemini/antigravity/scratch/event-photo-finder/.env.example).

---

## 🚀 Quick Start

From the project directory:

```bash
cd /Users/apple/.gemini/antigravity/scratch/event-photo-finder

# Start development server
npm run dev
```

Open your browser to:
[http://localhost:3000](http://localhost:3000)

---

## 📁 Project Architecture

```
event-photo-finder/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # App shell & metadata
│   │   ├── page.tsx           # Main application view & state orchestration
│   │   └── globals.css        # Tailwind styles & theme variables
│   ├── components/
│   │   ├── Navbar.tsx             # Brand header, mode indicator, organiser auth button
│   │   ├── EventList.tsx          # Event gallery, search input, filters
│   │   ├── EventCard.tsx          # Individual event card with action triggers
│   │   ├── SelfieSearchModal.tsx  # Attendee consent + selfie upload/camera flow
│   │   ├── WebcamCapture.tsx      # Browser webcam snapshot & face centering guide
│   │   ├── SearchResultsView.tsx  # Matched face photos & public photos gallery
│   │   ├── ImagePreviewModal.tsx  # Fullscreen lightbox photo preview & download
│   │   ├── AuthModal.tsx          # Organiser login & account creation tabs
│   │   ├── CreateEventModal.tsx   # Organiser event creation form
│   │   ├── ManageEventModal.tsx   # Photo bulk upload & live processing status
│   │   └── ApiSettingsModal.tsx   # Base URL configuration modal
│   ├── services/
│   │   └── api.ts                 # Typed API client connecting to backend
│   └── types/
│       └── api.ts                 # Complete TypeScript interfaces for all payloads
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## 🔌 API Endpoints Implemented

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/auth/register` | `POST` | Registers an organiser account |
| `/api/v1/auth/login` | `POST` | Authenticates organiser and returns Bearer tokens |
| `/api/v1/events` | `GET` | Fetches available events |
| `/api/v1/events` | `POST` | Creates a new event with access type |
| `/api/v1/events/:id` | `PATCH` | Updates event details (name, description, access_type, status, date) |
| `/api/v1/photos` | `GET` | Paginated search of event photos (`event_id`, `search`, `page`) |
| `/api/v1/photos/:id` | `GET` | Retrieves photo metadata and URLs by ID |
| `/api/v1/photos/:id` | `PATCH` | Updates photo visibility (`is_public: true/false`) |
| `/api/v1/photos/:id` | `DELETE` | Deletes photo, files, thumbnails, and vectors |
| `/api/v1/photos/batch-update` | `POST` | Batch updates photo visibility across events |
| `/api/v1/photos/batch-delete` | `POST` | Batch deletes multiple photos |
| `/api/v1/events/:id/photos/bulk` | `POST` | Bulk uploads event photos (`files`, `is_public`) |
| `/api/v1/events/:id/photos/processing-status` | `GET` | Reports face detection & indexing progress |
| `/api/v1/events/:id/restricted-faces` | `POST` | Restricts a face via uploaded photo of the person |
| `/api/v1/events/:id/restricted-faces/from-face/:faceId` | `POST` | Restricts an existing detected face by face ID |
| `/api/v1/events/:id/restricted-faces` | `GET` | Lists all restricted faces for an event |
| `/api/v1/events/:id/restricted-faces/:restrictedId` | `DELETE` | Removes a restriction |
| `/api/v1/events/:id/restricted-faces/:restrictedId/thumbnail` | `GET` | Delivers preview thumbnail of restricted face |
| `/api/v1/events/:id/search/consent` | `POST` | Records attendee consent and initializes session ID |
| `/api/v1/events/:id/search` | `POST` | Compares attendee selfie and returns matched items |
| `/api/v1/events/:id/photos/:photoId/view` | `GET` | Delivers full-resolution photo with session token |
| `/api/v1/events/:id/photos/:photoId/thumbnail` | `GET` | Delivers thumbnail image |

# cinigama-admin
