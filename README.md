# Zotion

A Notion-style real-time collaborative workspace — built from scratch to understand the infrastructure modern collaboration platforms run on.

No Firebase. No Auth0. No Socket.io. Just raw WebSockets, custom auth, and a hand-rolled queue architecture.

**Live demo:** [zotion-live.vercel.app](https://zotion-live.vercel.app)

> **Test accounts** — open in two separate browsers or incognito windows and edit the same page simultaneously:
>
> `test@gmail.com` / `123456`  
> `najmakhatun0999@gmail.com` / `123456`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL (Neon) |
| Real-time | Yjs (CRDT), WebSockets (`ws`) |
| Queue | Redis |
| Frontend | Next.js, React, TypeScript |
| Auth | JWT + Refresh Token Rotation |
| Infra | Vercel (frontend), Render (backend) |


## Architecture

```
Browser Client (Yjs Doc)
        │
        │  WebSocket — CRDT updates
        ▼
WebSocket Server (In-Memory Y.Doc)
        │
        │  enqueue update
        ▼
      Redis
   Update Queue
        │
        │  BRPOP
        ▼
 Background Worker
  Merge + Persist
        │
        ▼
   PostgreSQL
  yjsState blob
```

The real-time editing path is **fully decoupled from database writes**.

Updates flow: `Client → WebSocket → Server Memory → Redis → Worker → PostgreSQL`

This keeps latency low, writes batched, and the database load minimal.


<img width="276" height="459" alt="Screenshot 2026-02-26 at 11 05 06" src="https://github.com/user-attachments/assets/2fa0c8ff-7c79-48d2-890b-21a5fe25c153" />
<img width="607" height="261" alt="Screenshot 2026-02-26 at 10 48 49" src="https://github.com/user-attachments/assets/18566813-ea94-4a26-9900-57d9c1d67c8a" />

---

## Features

### Multi-Tenant Workspaces
Each workspace is fully isolated. Roles — **Admin**, **Editor**, **Viewer** — are enforced at the API layer.

### Block-Based Content Model
Pages are composed of typed, ordered blocks: paragraphs, headings, code blocks, todos, and images. Each block is an independent entity with a type, position, and JSON content payload — making insertion, deletion, and reordering straightforward.

### Real-Time Collaborative Editing
Built on **Yjs CRDTs**. Multiple users can edit simultaneously, updates can arrive out of order, and all clients converge to the same state — no server-side merge logic required.

### Live Cursors and Presence
Each browser tab gets its own cursor identity via `userId + tabId`, so collaborators can see exactly where others are typing.

### Hierarchical Pages
Pages support nested parent-child relationships via a self-referencing foreign key:
```
Workspace
└── Page
    └── Subpage
        └── Subpage
```

<img width="1466" height="827" alt="Screenshot 2026-02-26 at 10 55 29" src="https://github.com/user-attachments/assets/8c1132c2-e530-4be0-842b-d61f05c19779" />

<img width="1470" height="796" alt="Screenshot 2026-02-26 at 10 54 18" src="https://github.com/user-attachments/assets/dd8a325c-babf-4fb3-8fb5-82f2b5a65c87" />


### Optimistic UI
Client edits are applied instantly. If the server rejects an update, the UI reconciles automatically — keeping the editing experience fast and responsive.

---

## How Real-Time Sync Works

```
Keystroke
  → Client Yjs Doc (apply locally)
  → Send CRDT update via WebSocket
  → Server applies update to in-memory Y.Doc
  → Broadcast to other clients
  → Push to Redis queue
  → Worker merges updates
  → Persist full Yjs snapshot to PostgreSQL
```

Redis acts as the **durability buffer**. Instead of hitting the database on every keystroke, updates are queued, merged, and written as a single CRDT snapshot. This dramatically reduces write amplification.

---

## WebSocket Reliability

- **Heartbeats** — ping/pong every 30 seconds to keep idle connections alive
- **Auto-reconnect** — exponential backoff on disconnect
- **Offline queue** — updates buffered locally and flushed on reconnect (capped to prevent memory growth)
- **Memory lifecycle** — server-side `Y.Doc` is destroyed when the last user leaves a page

---

## Database Design

**Blocks as separate entities** — not embedded in pages. Each block is its own row, making reordering and updates efficient.

**Yjs state storage** — each page stores a `yjsState: Bytes` blob containing the full CRDT snapshot. The worker always merges before writing, so the database always holds a complete, replayable document state.

**Refresh token keystore** — tokens are stored independently per session under each user, enabling selective logout and multiple active sessions.

---

## Running Locally

```bash
# Clone
git clone https://github.com/yourusername/zotion
cd zotion

# Install
npm install

# Start backend
npm run dev

# Start frontend
cd frontend
npm run dev
```

---

## Why Build This?

**MVP complete — actively iterating.** The core workspace, collaboration, and content editing experience is functional and deployed. Focus now is on polish and consistency before the next round of features.

