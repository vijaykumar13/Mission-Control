# Mission Control — Design Document

## Overview
A personal command center web app for tracking all work: projects, ideas, knowledge base, and integrations with external tools.

## Key Requirements
- **Personal use** (single user)
- **Web app** with mobile-responsive access
- **Integrations** with Asana, Gmail, Google Calendar, GitHub (and future tools)
- **Minimal/clean aesthetic**
- **Always connected** (no offline requirement)

---

## Hosting & Deployment
- **Hosting:** Vercel (free tier, auto-deploys from GitHub)
- **URL:** `mission-control.vercel.app` (or custom domain)
- **Deploy flow:** Push to GitHub → Vercel auto-builds → Live

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 15 (App Router) | API routes for integrations, server components, file-based routing |
| Database | Turso (libSQL) + Drizzle ORM | SQLite-compatible cloud DB, works on Vercel serverless, vector support |
| Styling | Tailwind CSS v4 + Radix UI | Full visual control + accessible interaction primitives |
| State | Zustand + TanStack Query v5 | Minimal client state + smart server cache with auto-refetch |
| Markdown | TipTap | Rich editing for Knowledge Base and Ideas |
| Icons | Lucide React | Clean line icons matching minimal aesthetic |
| Validation | Zod | Schema validation shared between client and server |
| IDs | nanoid | Short, URL-safe, no auto-increment leakage |
| Package Manager | pnpm | Fast, disk-efficient, strict dependency resolution |
| Date Handling | date-fns | Tree-shakeable, immutable |
| **AI: Embeddings** | **OpenAI text-embedding-3-small** | **Convert text → 1536-dim vectors, ~$0.02/1M tokens** |
| **AI: LLM** | **OpenAI gpt-4o-mini** | **Smart summaries, chat with data, auto-tagging** |
| **AI: Framework** | **Vercel AI SDK** | **Streaming responses, structured output, tool calling** |
| **AI: Vector Store** | **Turso vector extension** | **Semantic search, same DB as structured data** |

---

## Core Screens

### 1. Dashboard (`/`)
The home screen — at a glance: what needs attention today.
- Greeting + date
- Quick capture input (idea, task, or note)
- 4 summary stat cards (Active Projects, Pending Tasks, Ideas Brewing, KB Articles)
- Today's Focus (due/overdue tasks from local + Asana)
- Upcoming Events (Google Calendar)
- Recent Activity feed
- Email Highlights (Gmail)

### 2. Projects (`/projects`)
- Grid of project cards with color accent, status badge, priority, progress bar
- Filter bar: All / Active / Paused / Completed + search
- "Linked from Asana" section for synced external projects
- New Project button

### 3. Project Detail (`/projects/[id]`)
- Header with project metadata
- Tabs: Tasks | Timeline | Notes | Activity | Linked
- Task list grouped by status, draggable to reorder
- Inline task creation

### 4. Ideas (`/ideas`)
- Kanban board with 4 columns: Spark → Exploring → Validating → Ready
- Drag cards between columns to change stage
- "Promote to Project" button on Ready cards
- Quick idea capture

### 5. Knowledge Base (`/kb`)
- Search bar + tag filter chips
- Pinned articles section (card grid)
- All articles list with title, description, tags, date
- Full markdown editor on article detail page

### 6. Activity (`/activity`)
- Chronological timeline of all events
- Filter by source (local, Asana, Gmail, Calendar, GitHub)
- Filter by entity type

### 7. Analytics (`/analytics`)
Full productivity intelligence dashboard:
- **Time Overview** — Total hours this week/month, comparison to previous periods, daily bar chart
- **Project Breakdown** — Hours per project (pie/bar chart), drill into task-level time
- **Productivity Heatmap** — Hour-by-day grid showing when you're most productive
- **Velocity Chart** — Tasks completed per week, trend line
- **Streaks** — Consecutive days with task completions
- **Project Health Scores** — Composite score per project (completion rate, overdue %, velocity)
- **AI Insights Panel** — Smart observations and suggestions generated weekly
- **Focus vs Meetings** — Time in deep work vs calendar events (from Google Calendar)

### 8. Settings (`/settings`)
- Integration management (enable/disable, configure, test, sync)
- Appearance (light/dark mode, accent color)
- Time tracking preferences (auto-detect sensitivity, idle timeout)
- Data export/import

---

## Time Tracking

### How It Works

**Auto-detect (passive):**
- When you navigate to a project or task page, a session starts automatically
- Tracks active time on that project/task (page must be in focus)
- Pauses after 5 minutes of inactivity (configurable in Settings)
- Resumes when you interact again
- Sessions < 1 minute are discarded (prevents noise from quick page visits)

**Manual timer (active):**
- Start/stop button available on any project or task
- Running timer shown in the top header bar globally
- Can switch between projects — stops current, starts new
- Timer persists across page navigation

**Manual log (after the fact):**
- Quick capture: "2h on Mission Control" parsed intelligently
- Time entry form on any project page
- Bulk log from the Analytics page

### Timer UI
- **Header bar:** Shows running timer with project name, elapsed time, stop button
- **Project page:** Timer toggle button in the project header
- **Task level:** Optional per-task timer for granular tracking
- **Quick capture:** Natural language time logging ("spent 3 hours on blog series")

---

## Data Model

### Core Entities
- **Projects** — id, title, description, status, priority, color, dates, external link
- **Tasks** — id, projectId (FK), title, status, priority, dueDate, sortOrder, external link
- **Ideas** — id, title, body (markdown), stage, category, projectId (FK when promoted)
- **KB Articles** — id, title, slug (unique), content (markdown), summary, pinned
- **Tags** — id, name (unique), color
- **Tag Assignments** — polymorphic join (tagId + entityId + entityType)
- **Activities** — append-only log (entityId, entityType, action, title, metadata, source)
- **Integration Configs** — provider settings, enabled flag, last sync time
- **Integration Cache** — cached external data with TTL

### Time Tracking Entities
- **Time Sessions** — id, projectId (FK), taskId (FK, optional), type (auto|manual|logged), startedAt, endedAt, duration (minutes), notes
- **Daily Summaries** — id, date, totalMinutes, projectBreakdown (JSON), tasksCompleted, ideasCreated, articlesWritten
- **Project Health** — id, projectId (FK), date, completionRate, overdueRate, velocity, healthScore, computedAt

### Relationships
- Projects 1:many Tasks
- Projects 1:many Time Sessions
- Tasks 1:many Time Sessions (optional)
- Ideas → Projects (optional FK, set on promote)
- Tags many:many Projects, Ideas, KB Articles (via tag_assignments)
- Activities → any entity (polymorphic)
- Projects 1:many Project Health (daily snapshots)

---

## Integration Architecture

### Adapter Pattern
Every external tool implements `IntegrationAdapter`:
```typescript
interface IntegrationAdapter<TConfig> {
  provider: string;
  displayName: string;
  testConnection(): Promise<{ ok: boolean; error?: string }>;
  sync(config: TConfig): Promise<SyncResult>;
  getCachedData(dataType: string): Promise<unknown | null>;
}
```

### Registry
Central `IntegrationRegistry` manages all adapters:
- `register(adapter)` — add at startup
- `syncAll()` — sync all enabled integrations
- Adding a new integration = 4 files (adapter, API route, component, register call)

### Sync Strategy
- **On-demand:** Sync when page loads if cache is stale (5min TTL)
- **Background refresh:** TanStack Query `refetchInterval` while tab is open
- **Manual trigger:** "Sync Now" in Settings + refresh icon on widgets
- **No webhooks** — polling on page load is sufficient for personal use

---

## Design System

### Colors (Warm Gray + Slate Blue Accent)
- Page background: `#FAFAF9`
- Card background: `#FFFFFF`
- Borders: `#E7E5E4`
- Primary text: `#1C1917`
- Secondary text: `#78716C`
- Accent: `#5B7FD6` (slate blue)
- Success: `#4ADE80`, Warning: `#FBBF24`, Danger: `#F87171`

### Typography
- Sans: Inter
- Mono: JetBrains Mono
- Scale: 12/14/16/18/20/24/30px (Major Third ratio)

### Spacing
- 4px base unit (Tailwind default scale)
- Card padding: 20px, Card gap: 16px, Section gap: 32px
- Sidebar: 240px expanded, 64px collapsed

### Visual Principles
1. Cards are the primary container
2. Color used sparingly and semantically
3. Dense but not cramped (14px default in lists)
4. No decorative elements — let data and whitespace work
5. All icons: Lucide, 18-20px, gray-500
6. Hover = background shift, transitions 150ms ease

### Responsive Breakpoints
- Mobile: < 640px (single column, bottom nav)
- Tablet: 640-1024px (two columns, collapsible sidebar)
- Desktop: > 1024px (full layout, expanded sidebar, 3-column grid)

---

## Project Structure
```
mission-control/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout (sidebar, providers)
│   │   ├── page.tsx            # Dashboard
│   │   ├── projects/           # Projects pages
│   │   ├── ideas/              # Ideas pages
│   │   ├── kb/                 # Knowledge Base pages
│   │   ├── activity/           # Activity feed
│   │   ├── analytics/          # Analytics & time tracking page
│   │   ├── settings/           # Settings
│   │   └── api/                # API route handlers
│   │       ├── time/           # Time tracking endpoints
│   │       │   ├── sessions/route.ts   # Start/stop/log sessions
│   │       │   └── summary/route.ts    # Daily/weekly summaries
│   │       ├── analytics/      # Analytics endpoints
│   │       │   ├── health/route.ts     # Project health scores
│   │       │   └── insights/route.ts   # AI-generated insights
│   ├── components/
│   │   ├── ui/                 # Design system primitives
│   │   ├── layout/             # Sidebar, Header, PageShell
│   │   ├── dashboard/          # Dashboard widgets
│   │   ├── projects/           # Project components
│   │   ├── ideas/              # Ideas components
│   │   ├── kb/                 # KB components
│   │   ├── activity/           # Activity components
│   │   ├── analytics/          # Charts, heatmap, health scores, timer
│   │   │   ├── time-tracker.tsx    # Running timer header widget
│   │   │   ├── time-chart.tsx      # Hours per project bar/pie chart
│   │   │   ├── heatmap.tsx         # Productivity heatmap (hour x day)
│   │   │   ├── velocity-chart.tsx  # Tasks/week trend line
│   │   │   ├── health-score.tsx    # Project health score card
│   │   │   ├── streaks.tsx         # Streak counter
│   │   │   └── ai-insights.tsx     # AI-generated insight cards
│   │   └── integrations/       # Integration display widgets
│   ├── lib/
│   │   ├── db/                 # Drizzle schema + migrations (Turso)
│   │   ├── ai/                 # AI layer
│   │   │   ├── embeddings.ts   # Generate & store embeddings (OpenAI)
│   │   │   ├── search.ts       # Semantic vector search
│   │   │   ├── chat.ts         # RAG chat with your data
│   │   │   ├── suggest.ts      # Auto-tagging, smart suggestions
│   │   │   └── digest.ts       # Weekly AI summary generation
│   │   ├── integrations/       # Adapter interface + implementations
│   │   ├── hooks/              # TanStack Query hooks
│   │   ├── stores/             # Zustand stores
│   │   └── utils/              # Helpers (cn, dates, constants)
│   └── styles/
│       └── globals.css         # CSS variables, Tailwind directives
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## AI Features

### Architecture
```
User query: "what was that mobile app idea?"
         |
         v
┌─── OpenAI Embeddings ──────────┐
│  Convert query → 1536-dim vector│
└────────────┬───────────────────┘
             v
┌─── Turso Vector Search ────────┐
│  Cosine similarity across all   │
│  projects, ideas, tasks, KB     │
└────────────┬───────────────────┘
             v
┌─── Ranked Results ─────────────┐
│  + optional LLM summary         │
└────────────────────────────────┘
```

### Embedding Strategy
- Auto-embed on create/update for all entities (projects, tasks, ideas, KB articles)
- Store embedding vectors alongside structured data in Turso
- Combine title + description/body into a single embedding per entity
- Background re-embed when content changes

### AI Features by Phase

**Phase 1 — Semantic Search (with core build):**
- Natural language search bar across all content
- "Find similar" button on any entity
- Auto-embed on create/update

**Phase 2 — Smart Features:**
- Auto-suggest tags based on content similarity
- Intelligent quick capture ("remind me to review PR tomorrow" → creates task with due date)
- Related content sidebar (viewing a project shows related ideas/articles)

**Phase 3 — AI Assistant:**
- Chat with your data (RAG — Retrieval Augmented Generation)
- Weekly AI-generated digest of activity and progress
- Smart project insights ("3 tasks overdue, 2 ideas ready to promote")
- Summarize long KB articles or project notes

### Data Model Addition
```
embeddings {
  id          text PRIMARY KEY
  entityId    text NOT NULL      // FK → any entity
  entityType  text NOT NULL      // 'project' | 'task' | 'idea' | 'kb_article'
  vector      F32_BLOB(1536)     // Turso vector type
  content     text NOT NULL      // Original text that was embedded
  model       text NOT NULL      // 'text-embedding-3-small'
  createdAt   integer NOT NULL
  updatedAt   integer NOT NULL
}
```

### API Routes
- `POST /api/search` — Semantic search across all entities
- `POST /api/ai/embed` — Generate and store embedding for an entity
- `POST /api/ai/suggest-tags` — Get tag suggestions for content
- `POST /api/ai/chat` — Chat with your data (RAG)
- `POST /api/ai/digest` — Generate weekly summary

---

## Implementation Phases

1. **Scaffolding** — Next.js init, deps, folder structure, Drizzle + Turso setup
2. **Design System + Layout** — CSS variables, UI primitives, sidebar, responsive shell
3. **Data Layer** — Schema (including time tracking tables), API routes, hooks, activity logging
4. **Projects** — List, detail, tasks, CRUD, drag-reorder
5. **Ideas** — Kanban board, stages, promote to project
6. **Knowledge Base** — Articles, markdown editor, search, tags
7. **Time Tracking** — Auto-detect sessions, manual timer, time logging, header timer widget
8. **AI: Semantic Search** — Embeddings, vector storage, natural language search across all content
9. **Integrations** — Adapter framework, Asana, Calendar, Gmail
10. **Dashboard** — Summary cards, widgets, quick capture, activity, running timer
11. **Analytics** — Time charts, productivity heatmap, velocity, streaks, project health scores
12. **Activity Feed + Settings** — Full timeline, integration management, tracking preferences
13. **AI: Smart Features** — Auto-tagging, smart capture, related content, find similar
14. **AI: Assistant + Insights** — Chat with data (RAG), weekly digest, AI insights on analytics page
15. **Polish** — Keyboard shortcuts, animations, dark mode, performance
