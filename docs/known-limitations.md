# Known Limitations

## Document uploads run synchronously (no background worker)

`POST /knowledge/upload` ([backend/app/routes/knowledge.py](../backend/app/routes/knowledge.py))
parses the PDF, chunks it, and writes parent/child chunks to Postgres + Chroma
all within the single HTTP request. There is no background job queue (Celery,
RQ, arq, etc.) yet.

Consequences:
- The request blocks until ingestion fully completes. Large PDFs or
  OCR-heavy documents (see `app/services/document_parser.py`) can take long
  enough to risk client/proxy timeouts.
- The frontend upload dropzone's progress bar
  ([frontend/src/components/knowledge/UploadDropzone.tsx](../frontend/src/components/knowledge/UploadDropzone.tsx))
  is a cosmetic simulated animation, not real upload/processing progress —
  there is no server-sent progress signal to drive it.
- Because ingestion is synchronous, a successful response always means the
  document already reached a terminal `processed` state. The `parsing` /
  `ocr_engaged` statuses on the frontend `Document` type
  ([frontend/src/types/index.ts](../frontend/src/types/index.ts)) are
  currently unused placeholders for a future async flow.

Revisit this once documents are large/frequent enough to justify a proper
job queue with status polling or a push-based (WebSocket/SSE) status update.

## No persisted document list on the backend

There is no `documents` table or `GET /knowledge` listing endpoint — the
backend only tracks ingested text as `ParentChunk` rows
([backend/app/models/knowledge.py](../backend/app/models/knowledge.py)),
with no filename, size, or per-document status.

The Knowledge Workspace's document list
([frontend/src/components/knowledge/KnowledgePanel.tsx](../frontend/src/components/knowledge/KnowledgePanel.tsx))
is therefore populated client-side only, from each successful upload response
via a shared upload hook
([frontend/src/hooks/useUploadDocument.ts](../frontend/src/hooks/useUploadDocument.ts))
that seeds `useDocuments`
([frontend/src/hooks/useDocuments.ts](../frontend/src/hooks/useDocuments.ts)).
It resets on page reload and isn't shared across tabs/devices.

Fixing this requires adding a `Document` model/table on the backend plus a
listing endpoint, at which point `useDocuments` should be switched back to
fetching from that endpoint instead of seeding an empty local cache.

## PDF-only enforcement

Only `.pdf` files are accepted, enforced in two places:
- Frontend: `frontend/src/components/knowledge/UploadDropzone.tsx` (and the
  chat composer's attach button, `frontend/src/components/chat/ChatInputToolbar.tsx`,
  which uploads through the same shared hook) rejects non-PDF files
  client-side (by MIME type and extension) before ever calling the API.
- Backend: `backend/app/routes/knowledge.py` rejects any filename not ending
  in `.pdf` (case-sensitive) with a 400.

Note the backend check is case-sensitive (`.pdf` only, not `.PDF`) while the
frontend check is case-insensitive — a `.PDF` file will pass the frontend
check but still be rejected by the backend with a clear error message. Not
currently a problem in practice, but worth aligning if it comes up.

## Workspace redesign: features with no backend support (client-side only)

The premium workspace redesign added UI for several features the backend
doesn't support yet. Each is implemented as an honest, clearly-labeled
client-side approximation rather than silently faking data:

- **Pinned chats** — `frontend/src/hooks/useSessionPins.ts` persists pinned
  session IDs to `localStorage` only. Not synced across devices/browsers, and
  there is no `pinned` field on the backend `ChatSession` model.
- **Deleting a chat session** — there is no `DELETE` endpoint for sessions
  (only create/read via `POST /chat/message`, `GET /chat/sessions`). Deleting
  a conversation (`frontend/src/hooks/useHiddenSessions.ts`) only hides it
  from this browser's sidebar; the session and its messages remain in
  Postgres untouched.
- **Document rename/delete** — same story as above: no backend endpoint
  exists for either. Rename relabels the document in the local list only;
  delete removes it from the local list only. Both dialogs
  (`frontend/src/components/knowledge/RenameDocumentDialog.tsx`,
  `DeleteDocumentDialog.tsx`) say so explicitly rather than implying the
  underlying data changes.
- **Regenerate response / Retry failed response / Edit previous prompt**
  (`frontend/src/components/chat/MessageBubbleAssistant.tsx`,
  `EditableUserMessage.tsx`, `ChatMessages.tsx`'s retry banner) — the backend
  persists a new user `ChatMessage` row the instant a request lands, before
  streaming even starts, and there's no way to truncate or edit conversation
  history. All three actions resend the (possibly edited) text through the
  normal send flow as a **new trailing turn**, not a true in-place
  regeneration/edit. The regenerate button's tooltip says "sends a new
  message" for exactly this reason.
- **Model selector** (`frontend/src/components/chat/ModelSelector.tsx`) — the
  backend hardcodes a single Groq model
  (`backend/app/services/llm_client.py`) with no model-switching endpoint.
  The selector shows that one model and isn't wired to anything.

If any of these need to be "real," the backend needs the corresponding
endpoint first (session/document delete, message truncation, multi-model
support) — none of this is a frontend-only fix.
