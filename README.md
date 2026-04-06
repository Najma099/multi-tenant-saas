# Zotion ✦

> A Notion-style collaborative workspace — built from scratch, no shortcuts taken.

Zotion is a real-time document editor where multiple people can write together, simultaneously, without conflicts. Under the hood, it uses **CRDTs, raw WebSockets, and a custom persistence pipeline** — every layer designed and controlled from scratch.

```
No Firebase. No Socket.io. No managed auth.
Just clean systems engineering.
```

---

## ◈ Live Demo

🔗 **[zotion-live.vercel.app](https://zotion-live.vercel.app)**

Open in two tabs and watch the magic happen.

| Account | Password |
|---|---|
| test@gmail.com | 123456 |
| najmakhatun0999@gmail.com | 123456 |

---

## ◈ What Makes This Interesting

Most real-time apps either use Firebase or glue together managed services. Zotion does neither.

| Concept | What's happening |
|---|---|
| ⚡ Low latency | Database is never touched per keystroke |
| 🔀 Conflict-free edits | CRDTs handle concurrent changes automatically |
| 🧱 Decoupled pipeline | Real-time sync and persistence are fully independent |
| 🔐 Secure sessions | JWT + refresh token rotation, multi-session support |
| 📡 Reliable WebSockets | Heartbeat, auto-reconnect, offline buffering |

---

## ◈ How It Works

### The Big Picture

```
Browser (Yjs Doc)
      │
      │  WebSocket — CRDT updates
      ▼
WebSocket Server — in-memory Y.Doc
      │
      │  enqueue update
      ▼
   Redis Queue
      │
      │  BRPOP (background worker)
      ▼
Background Worker — merge + batch
      │
      ▼
PostgreSQL — single CRDT snapshot
```

The core idea is simple:

> **Real-time collaboration is completely decoupled from database writes.**

Every keystroke flows through memory and Redis first. The database only sees clean, batched snapshots — not a flood of individual updates. This keeps latency low and the system scalable.

---

### The Full Sync Pipeline

```
You type
  → Local Yjs doc updates instantly       (optimistic UI)
  → CRDT update sent over WebSocket
  → Server updates its in-memory doc
  → Update broadcast to all other clients
  → Update pushed into Redis queue
  → Worker picks it up, merges it
  → Single snapshot written to PostgreSQL
```

**Why Redis in the middle?**
Rather than writing every update to the DB (which would be thousands of writes per session), Redis acts as a **durability buffer**. The worker drains the queue, merges everything into one CRDT snapshot, and does a single write. Dramatically less load on the database.

---

## ◈ Core Features

### 🤝 Real-Time Collaborative Editing

Built on **Yjs**, a battle-tested CRDT library. Multiple people can type at the same time, go offline, come back — and everything converges to the same correct state. No server-side conflict resolution needed.

---

### 🟢 Live Presence & Cursors

Every open tab gets a unique session (`userId + tabId`). You can see exactly where collaborators are in the document, in real time.

---

### 🧱 Block-Based Document Model

Pages are made of blocks — text, headings, to-dos, code snippets, images. Each block is an independent entity, making inserts, updates, and reordering efficient and clean.

---

### 🏢 Multi-Tenant Workspaces

Each workspace is fully isolated. Roles (Admin / Editor / Viewer) are enforced at the API layer, not just the frontend.

---

### 🌳 Hierarchical Pages

```
Workspace
 └── Page
      └── Subpage
           └── Subpage
```

---

### ⚡ Optimistic UI

Edits appear instantly on your screen. If something fails, the UI reconciles automatically — no janky rollbacks, no lost work.

---

## ◈ WebSocket Reliability

WebSockets can be flaky. Zotion handles this gracefully:

- **Heartbeat (ping/pong)** — keeps connections alive
- **Exponential backoff** — auto-reconnects without hammering the server
- **Offline buffering** — queues updates locally while disconnected (bounded size)
- **Memory cleanup** — properly tears down state on disconnect

---

## ◈ Database Design

### Blocks — stored as separate rows
Avoids the problem of giant nested JSON blobs. Partial updates are efficient.

### CRDT State — stored as a binary snapshot
```sql
yjsState  BYTEA
```
Each page stores one complete snapshot. The worker always merges before writing, so the DB stays clean.

### Auth — JWT + refresh token rotation
- Multiple active sessions supported
- Selective logout per session
- Token invalidation on suspicious activity

---

## ◈ Tech Stack

| Layer | Tech |
|---|---|
| Backend | Node.js, Express, Prisma |
| Database | PostgreSQL (Neon) |
| Real-time | Yjs (CRDT), WebSockets (`ws`) |
| Queue | Redis |
| Frontend | Next.js, React, TypeScript |
| Auth | JWT + Refresh Token Rotation |
| Infra | Vercel, Render |

---

## ◈ Run Locally

```bash
git clone https://github.com/yourusername/zotion
cd zotion

cd backend
npm install
npm run dev

# In another terminal
cd frontend
npm run dev
```

---

## ◈ Why I Built This

Most tutorials show you how to use real-time services. This project is about understanding what those services are actually doing:

- How do CRDTs eliminate merge conflicts?
- How do you keep latency low when persistence is slow?
- How do you separate the user experience layer from the storage layer?
- How do WebSockets behave at scale, and how do you make them reliable?

Zotion is the answer to all of those questions, in working code.

---

## ◈ Status

| | |
|---|---|
| ✅ | Core system complete |
| ✅ | Real-time collaboration working |
| 🔄 | Performance tuning + UX polish in progress |
