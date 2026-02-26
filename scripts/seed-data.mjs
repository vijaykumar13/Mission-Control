import { createClient } from "@libsql/client";
import { nanoid } from "nanoid";

const client = createClient({
  url: "libsql://mission-control-vijaykumar13.aws-us-east-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzE5OTE0MDcsImlkIjoiMDE5YzkyZWEtZDgwMS03NDlkLWFlN2ItOTRhNzg5NTdiNTc4IiwicmlkIjoiYTliZTg5NTQtZDViZi00MGIwLWE0NDQtOWQ0NTM3MDg0MTgyIn0.HFRRH9UBUXsNyOop36oxd2hZuK19PdkTnM_uTz84pTgCqmM8ZS-MCK7P75g6oiXHWaFAPFoPCI86LlTKcHLPDQ",
});

const now = Date.now();
const day = 86400000;
const hour = 3600000;

// Project IDs from existing data
const PROJECTS = {
  topHustle: "2BCiy-WMhB-A",
  dataFanalytics: "LafFe5RpM6wC",
  vijayBuilds: "a3fyxlkQULgN",
  buildInPublic: "mKYkxZq6bdwQ",
  healthCare: "0e-CiG5idvUK",
  missionControl: "ubuVlX9n7OcL",
};

async function seedIdeas() {
  console.log("Seeding ideas...");
  const ideas = [
    {
      title: "AI-powered thumbnail A/B testing tool",
      body: "Build a tool that uses AI to generate and test multiple YouTube thumbnail variations. Track CTR data and automatically suggest winners. Could integrate with YouTube API.",
      stage: "exploring",
      category: "product",
      projectId: PROJECTS.topHustle,
    },
    {
      title: "Weekly email digest for subscribers",
      body: "Create an automated email newsletter that summarizes weekly content, upcoming videos, and community highlights. Use Resend or SendGrid.",
      stage: "spark",
      category: "marketing",
      projectId: PROJECTS.vijayBuilds,
    },
    {
      title: "Interactive data viz playground",
      body: "A web-based playground where users can paste their data and generate interactive charts with AI assistance. Think Observable + ChatGPT.",
      stage: "validating",
      category: "product",
      projectId: PROJECTS.dataFanalytics,
    },
    {
      title: "Build in Public leaderboard / streak tracker",
      body: "Gamify the build-in-public process with streaks, badges, and a community leaderboard. Track tweets, commits, and content posted.",
      stage: "exploring",
      category: "feature",
      projectId: PROJECTS.buildInPublic,
    },
    {
      title: "Healthcare cost comparison API",
      body: "A public API that allows developers to query healthcare procedure costs by ZIP code. Aggregate data from CMS and state databases.",
      stage: "spark",
      category: "product",
      projectId: PROJECTS.healthCare,
    },
    {
      title: "Voice-to-task capture via Siri Shortcuts",
      body: "Create a Siri Shortcut that captures voice memos and sends them to Mission Control's quick capture API. Auto-categorize with AI.",
      stage: "spark",
      category: "feature",
      projectId: PROJECTS.missionControl,
    },
    {
      title: "Sponsor matchmaking platform for creators",
      body: "A two-sided marketplace connecting small YouTube creators with relevant sponsors based on niche, audience size, and engagement rates.",
      stage: "spark",
      category: "product",
      projectId: null,
    },
    {
      title: "CLI tool for project scaffolding",
      body: "A CLI that scaffolds full-stack projects with best practices: Next.js + Drizzle + Turso + Tailwind. Opinionated but configurable.",
      stage: "exploring",
      category: "developer-tool",
      projectId: null,
    },
    {
      title: "Auto-generate YouTube chapters with AI",
      body: "Use Whisper to transcribe videos, then GPT to identify topic segments and generate timestamped chapters. Huge time saver.",
      stage: "validating",
      category: "automation",
      projectId: PROJECTS.topHustle,
    },
    {
      title: "Mission Control mobile companion app",
      body: "React Native or Expo app for quick task capture, timer, and status checks on the go. Sync with the main web app via API.",
      stage: "exploring",
      category: "product",
      projectId: PROJECTS.missionControl,
    },
  ];

  for (const idea of ideas) {
    const id = nanoid(12);
    const ts = Math.floor((now - Math.random() * 7 * day) / 1000);
    await client.execute({
      sql: `INSERT INTO ideas (id, title, body, stage, category, project_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, idea.title, idea.body, idea.stage, idea.category, idea.projectId, ts, ts],
    });
  }
  console.log(`  ✓ ${ideas.length} ideas created`);
}

async function seedKBArticles() {
  console.log("Seeding KB articles...");
  const articles = [
    {
      title: "Mission Control Architecture",
      slug: "mission-control-architecture",
      content: `<h2>Tech Stack</h2><ul><li><strong>Frontend:</strong> Next.js 16 with App Router, React 19, Tailwind CSS v4</li><li><strong>Database:</strong> Turso (cloud SQLite) with Drizzle ORM</li><li><strong>State:</strong> Zustand for client, TanStack Query for server</li><li><strong>AI:</strong> OpenAI via AI SDK (chat, embeddings, summaries)</li></ul><h2>Project Structure</h2><p>The app follows Next.js App Router conventions with route groups for pages and API routes under <code>/api</code>. All database operations go through Drizzle ORM with typed schema definitions.</p><h2>Key Decisions</h2><ul><li>Single-user app — no auth needed</li><li>Turso for zero-config cloud SQLite with edge performance</li><li>Zod 4 for all API validation</li><li>Polymorphic tags via tag_assignments table</li></ul>`,
      pinned: true,
    },
    {
      title: "YouTube Content Strategy Playbook",
      slug: "youtube-content-strategy",
      content: `<h2>Content Pillars</h2><ol><li><strong>Build With AI:</strong> Live coding sessions building real apps with AI tools</li><li><strong>Side Hustle Tech:</strong> Tools and automations for couples building together</li><li><strong>Data Analytics:</strong> Making data accessible and visual for everyone</li></ol><h2>Upload Schedule</h2><p>Target 2 videos per week across channels. Batch filming on weekends, editing during the week.</p><h2>Thumbnail Rules</h2><ul><li>Bold text (3-5 words max)</li><li>High contrast colors</li><li>Expressive face or compelling visual</li><li>Test 2-3 variations per video</li></ul>`,
      pinned: false,
    },
    {
      title: "Drizzle ORM Cheat Sheet",
      slug: "drizzle-orm-cheatsheet",
      content: `<h2>Common Patterns</h2><h3>Select with relations</h3><pre><code>const result = await db.query.projects.findMany({
  with: { tasks: true },
  where: eq(projects.status, "active"),
});</code></pre><h3>Insert</h3><pre><code>await db.insert(projects).values({
  id: nanoid(12),
  title: "New Project",
  createdAt: new Date(),
  updatedAt: new Date(),
});</code></pre><h3>Update</h3><pre><code>await db.update(projects)
  .set({ status: "completed", updatedAt: new Date() })
  .where(eq(projects.id, id));</code></pre><h2>Gotchas</h2><ul><li>Turso/SQLite stores timestamps as integers (Unix seconds)</li><li>Use <code>{ mode: "timestamp" }</code> for auto Date conversion</li><li>Enum columns are just text with type constraints</li></ul>`,
      pinned: true,
    },
    {
      title: "Zod 4 Migration Notes",
      slug: "zod-4-migration",
      content: `<h2>Breaking Changes from Zod 3</h2><ul><li><code>z.record()</code> now requires 2 arguments: <code>z.record(z.string(), z.any())</code></li><li>Error access: use <code>.issues</code> not <code>.errors</code></li><li><code>.default()</code> behavior changed — applies during parse, not during type inference</li><li>Import from <code>zod/v4</code> for new features</li></ul><h2>Validation Pattern</h2><pre><code>import { z } from "zod";
const schema = z.object({ title: z.string().min(1) });
const result = schema.safeParse(data);
if (!result.success) throw new ValidationError(result.error.issues);</code></pre>`,
      pinned: false,
    },
    {
      title: "Data Fanalytics Launch Plan",
      slug: "data-fanalytics-launch",
      content: `<h2>Launch Timeline</h2><ol><li><strong>Week 1-2:</strong> Landing page + waitlist</li><li><strong>Week 3-4:</strong> Beta with 50 users</li><li><strong>Week 5-6:</strong> Public launch + Product Hunt</li></ol><h2>Key Metrics</h2><ul><li>Waitlist signups (target: 500)</li><li>Beta activation rate (target: 60%)</li><li>Week 1 retention (target: 40%)</li></ul><h2>Marketing Channels</h2><ul><li>YouTube demos on VijayBuildsWithAI</li><li>Twitter/X build in public updates</li><li>Reddit r/dataisbeautiful, r/analytics</li><li>Dev.to technical articles</li></ul>`,
      pinned: false,
    },
    {
      title: "Build in Public Best Practices",
      slug: "build-in-public-guide",
      content: `<h2>Core Principles</h2><ul><li><strong>Transparency:</strong> Share real numbers — revenue, users, failures</li><li><strong>Consistency:</strong> Post updates at least 3x/week</li><li><strong>Authenticity:</strong> Don't just share wins, share struggles too</li></ul><h2>Content Types That Work</h2><ul><li>Weekly progress threads</li><li>Behind-the-scenes screenshots</li><li>Revenue/metrics updates</li><li>Lessons learned from failures</li><li>"How I built X" technical breakdowns</li></ul><h2>Tools</h2><ul><li>Twitter/X for daily updates</li><li>YouTube for deep dives</li><li>GitHub for code transparency</li><li>Mission Control for tracking everything</li></ul>`,
      pinned: false,
    },
  ];

  for (const article of articles) {
    const id = nanoid(12);
    const ts = Math.floor((now - Math.random() * 14 * day) / 1000);
    await client.execute({
      sql: `INSERT INTO kb_articles (id, title, slug, content, summary, pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, article.title, article.slug, article.content, null, article.pinned ? 1 : 0, ts, ts],
    });
  }
  console.log(`  ✓ ${articles.length} KB articles created`);
}

async function seedTags() {
  console.log("Seeding tags...");
  const tagList = [
    { name: "youtube", color: "#FF0000" },
    { name: "ai", color: "#8B5CF6" },
    { name: "launch", color: "#F59E0B" },
    { name: "marketing", color: "#EC4899" },
    { name: "development", color: "#3B82F6" },
    { name: "automation", color: "#10B981" },
    { name: "content", color: "#F97316" },
    { name: "data", color: "#06B6D4" },
    { name: "urgent", color: "#EF4444" },
    { name: "side-project", color: "#8B5CF6" },
  ];

  const tagIds = {};
  for (const tag of tagList) {
    const id = nanoid(12);
    tagIds[tag.name] = id;
    await client.execute({
      sql: `INSERT INTO tags (id, name, color) VALUES (?, ?, ?)`,
      args: [id, tag.name, tag.color],
    });
  }

  // Assign tags to projects
  const assignments = [
    { tagName: "youtube", entityId: PROJECTS.topHustle, entityType: "project" },
    { tagName: "content", entityId: PROJECTS.topHustle, entityType: "project" },
    { tagName: "youtube", entityId: PROJECTS.vijayBuilds, entityType: "project" },
    { tagName: "ai", entityId: PROJECTS.vijayBuilds, entityType: "project" },
    { tagName: "data", entityId: PROJECTS.dataFanalytics, entityType: "project" },
    { tagName: "launch", entityId: PROJECTS.dataFanalytics, entityType: "project" },
    { tagName: "marketing", entityId: PROJECTS.buildInPublic, entityType: "project" },
    { tagName: "side-project", entityId: PROJECTS.buildInPublic, entityType: "project" },
    { tagName: "development", entityId: PROJECTS.healthCare, entityType: "project" },
    { tagName: "data", entityId: PROJECTS.healthCare, entityType: "project" },
    { tagName: "development", entityId: PROJECTS.missionControl, entityType: "project" },
    { tagName: "ai", entityId: PROJECTS.missionControl, entityType: "project" },
    { tagName: "automation", entityId: PROJECTS.missionControl, entityType: "project" },
  ];

  for (const a of assignments) {
    await client.execute({
      sql: `INSERT INTO tag_assignments (id, tag_id, entity_id, entity_type) VALUES (?, ?, ?, ?)`,
      args: [nanoid(12), tagIds[a.tagName], a.entityId, a.entityType],
    });
  }

  console.log(`  ✓ ${tagList.length} tags + ${assignments.length} assignments created`);
  return tagIds;
}

async function seedActivities() {
  console.log("Seeding activities...");
  const activities = [
    { entityId: PROJECTS.missionControl, entityType: "project", action: "updated", title: "Added UI polish: confirm dialogs, timezone support", source: "local", hoursAgo: 2 },
    { entityId: PROJECTS.missionControl, entityType: "project", action: "updated", title: "Added analytics charts with Recharts", source: "local", hoursAgo: 4 },
    { entityId: PROJECTS.missionControl, entityType: "project", action: "updated", title: "Built command palette and quick capture", source: "local", hoursAgo: 6 },
    { entityId: PROJECTS.missionControl, entityType: "project", action: "updated", title: "Added TipTap rich text editor to Knowledge Base", source: "local", hoursAgo: 8 },
    { entityId: PROJECTS.missionControl, entityType: "project", action: "updated", title: "Implemented AI chat panel and smart capture", source: "local", hoursAgo: 10 },
    { entityId: PROJECTS.dataFanalytics, entityType: "project", action: "updated", title: "Updated landing page copy and CTAs", source: "local", hoursAgo: 24 },
    { entityId: PROJECTS.dataFanalytics, entityType: "task", action: "completed", title: "Completed: Set up Vercel deployment pipeline", source: "local", hoursAgo: 26 },
    { entityId: PROJECTS.topHustle, entityType: "task", action: "completed", title: "Completed: Film intro sequence for channel trailer", source: "local", hoursAgo: 30 },
    { entityId: PROJECTS.vijayBuilds, entityType: "task", action: "completed", title: "Completed: Record Mission Control build session #3", source: "local", hoursAgo: 36 },
    { entityId: PROJECTS.buildInPublic, entityType: "project", action: "updated", title: "Added community features roadmap", source: "local", hoursAgo: 48 },
    { entityId: PROJECTS.healthCare, entityType: "task", action: "created", title: "Created: Research CMS pricing data API endpoints", source: "local", hoursAgo: 50 },
    { entityId: PROJECTS.vijayBuilds, entityType: "idea", action: "created", title: "New idea: AI-powered thumbnail A/B testing", source: "local", hoursAgo: 52 },
    { entityId: PROJECTS.missionControl, entityType: "idea", action: "created", title: "New idea: Voice-to-task capture via Siri Shortcuts", source: "local", hoursAgo: 60 },
    { entityId: PROJECTS.dataFanalytics, entityType: "task", action: "completed", title: "Completed: Design chart component library", source: "local", hoursAgo: 72 },
    { entityId: PROJECTS.topHustle, entityType: "task", action: "completed", title: "Completed: Outline first 5 video topics", source: "local", hoursAgo: 96 },
  ];

  for (const a of activities) {
    const ts = Math.floor((now - a.hoursAgo * hour) / 1000);
    await client.execute({
      sql: `INSERT INTO activities (id, entity_id, entity_type, action, title, metadata, source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [nanoid(12), a.entityId, a.entityType, a.action, a.title, null, a.source, ts],
    });
  }
  console.log(`  ✓ ${activities.length} activities created`);
}

async function seedDailySummaries() {
  console.log("Seeding daily summaries...");
  const summaries = [
    { daysAgo: 0, totalMinutes: 185, tasksCompleted: 3, ideasCreated: 1, articlesWritten: 0 },
    { daysAgo: 1, totalMinutes: 240, tasksCompleted: 5, ideasCreated: 2, articlesWritten: 1 },
    { daysAgo: 2, totalMinutes: 160, tasksCompleted: 2, ideasCreated: 0, articlesWritten: 0 },
    { daysAgo: 3, totalMinutes: 310, tasksCompleted: 7, ideasCreated: 1, articlesWritten: 1 },
    { daysAgo: 4, totalMinutes: 95, tasksCompleted: 1, ideasCreated: 0, articlesWritten: 0 },
    { daysAgo: 5, totalMinutes: 275, tasksCompleted: 4, ideasCreated: 3, articlesWritten: 0 },
    { daysAgo: 6, totalMinutes: 200, tasksCompleted: 3, ideasCreated: 0, articlesWritten: 1 },
  ];

  for (const s of summaries) {
    const date = new Date(now - s.daysAgo * day);
    const dateStr = date.toISOString().split("T")[0];
    const ts = Math.floor(date.getTime() / 1000);

    const breakdown = {};
    breakdown[PROJECTS.missionControl] = Math.floor(s.totalMinutes * 0.4);
    breakdown[PROJECTS.dataFanalytics] = Math.floor(s.totalMinutes * 0.25);
    breakdown[PROJECTS.topHustle] = Math.floor(s.totalMinutes * 0.2);
    breakdown[PROJECTS.vijayBuilds] = Math.floor(s.totalMinutes * 0.15);

    await client.execute({
      sql: `INSERT INTO daily_summaries (id, date, total_minutes, project_breakdown, tasks_completed, ideas_created, articles_written, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [nanoid(12), dateStr, s.totalMinutes, JSON.stringify(breakdown), s.tasksCompleted, s.ideasCreated, s.articlesWritten, ts],
    });
  }
  console.log(`  ✓ ${summaries.length} daily summaries created`);
}

async function main() {
  console.log("🚀 Seeding Mission Control data...\n");

  await seedIdeas();
  await seedKBArticles();
  await seedTags();
  await seedActivities();
  await seedDailySummaries();

  console.log("\n✅ All data seeded successfully!");
}

main().catch(console.error);
