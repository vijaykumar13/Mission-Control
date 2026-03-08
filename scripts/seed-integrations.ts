/**
 * Seed integration cache with data from MCP connectors.
 * Run: npx tsx scripts/seed-integrations.ts
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, and } from "drizzle-orm";
import { integrationConfigs, integrationCache } from "../src/lib/db/schema";
import { nanoid } from "nanoid";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const db = drizzle(client);

function createId() {
  return nanoid(12);
}

const now = new Date();
// Set expiry far in the future since we'll refresh via MCP
const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

// Calendar data from MCP
const calendarData = {
  events: [
    {
      id: "07i6d6sgm3onc9cniqbi4uigup",
      summary: "Meeting with George of URackIT.com",
      start: "2026-03-09T17:00:00-04:00",
      end: "2026-03-09T18:00:00-04:00",
      location: "511 Ocean Ave, Massapequa, NY 11758, USA",
      htmlLink: "https://www.google.com/calendar/event?eid=MDdpNmQ2c2dtM29uYzljbmlxYmk0dWlndXAgdmlqYXlAZGF0YWZhbmFseXRpY3MuY29t&ctz=America/New_York",
      status: "confirmed",
      organizer: "vijay@datafanalytics.com",
    },
  ],
  lastFetched: now.toISOString(),
};

// Gmail data from MCP
const gmailData = {
  messages: [
    {
      id: "19ccd746045b1c18",
      threadId: "19ccd746045b1c18",
      subject: "BNI Reminder! You are registered to BNI Island Visionaries on Tuesday at 7:00 AM",
      from: "BNI Connect Support Team <bni.notifications@bniconnectglobal.com>",
      snippet: "Your BNI Chapter visit is coming up! We can't wait to have you join BNI Island Visionaries Chapter's Meeting on 03/10/2026, at 7:00 AM.",
      date: new Date(1772973481000).toISOString(),
      unread: true,
      labels: ["UNREAD", "IMPORTANT", "CATEGORY_UPDATES", "INBOX"],
    },
    {
      id: "19cc586422005bb7",
      threadId: "19cc586422005bb7",
      subject: "Your free trial has expired",
      from: "Shiv at Kit <help@convertkit.com>",
      snippet: "Hey Vijay Kumar, We wanted to let you know that your free trial has expired, so you no longer have access to Creator Plan features.",
      date: new Date(1772840435000).toISOString(),
      unread: false,
      labels: ["IMPORTANT", "CATEGORY_UPDATES", "INBOX"],
    },
    {
      id: "19cc4dedceb93b79",
      threadId: "19cc4dedceb93b79",
      subject: "Your guide is here — 5 Conversations Every Immigrant Dad Needs",
      from: "Immigrant Dad <immigrant-dad-guide@mail.beehiiv.com>",
      snippet: "Thanks for joining. Here's the guide I promised.",
      date: new Date(1772829464000).toISOString(),
      unread: false,
      labels: ["IMPORTANT", "CATEGORY_UPDATES", "INBOX"],
    },
    {
      id: "19cc3e998db9cc59",
      threadId: "19cbc2910681f238",
      subject: "Re: Great meeting you tonight, Isa — healthcare cost question follow-up",
      from: "Isa Abdur-Rahman <isa.abdurrahman@fhfg.com>",
      snippet: "I will send you an invitation for Wednesday.",
      date: new Date(1772813387000).toISOString(),
      unread: false,
      labels: ["IMPORTANT", "CATEGORY_PERSONAL", "INBOX"],
    },
    {
      id: "19cc396bccf0cb3b",
      threadId: "19cc396bccf0cb3b",
      subject: "Thank You! Your registration to visit BNI LI Referral Source on 03/12/2026 is confirmed!",
      from: "BNI Global Technology Team <bni.notifications@bniconnectglobal.com>",
      snippet: "Welcome to Growing Your Business. We are so glad you have taken the next step toward growing your business.",
      date: new Date(1772807961000).toISOString(),
      unread: false,
      labels: ["IMPORTANT", "CATEGORY_UPDATES", "INBOX"],
    },
  ],
  unreadCount: 1,
  lastFetched: now.toISOString(),
};

type Provider = "asana" | "gmail" | "calendar" | "github";

async function upsertConfig(provider: Provider) {
  const [existing] = await db
    .select({ id: integrationConfigs.id })
    .from(integrationConfigs)
    .where(eq(integrationConfigs.provider, provider));

  if (existing) {
    await db
      .update(integrationConfigs)
      .set({
        enabled: true,
        config: JSON.stringify({ accessToken: "mcp-managed" }),
        lastSyncAt: now,
        updatedAt: now,
      })
      .where(eq(integrationConfigs.id, existing.id));
  } else {
    await db.insert(integrationConfigs).values({
      id: createId(),
      provider,
      enabled: true,
      config: JSON.stringify({ accessToken: "mcp-managed" }),
      lastSyncAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }
}

async function upsertCache(provider: string, data: unknown) {
  const [existing] = await db
    .select({ id: integrationCache.id })
    .from(integrationCache)
    .where(
      and(
        eq(integrationCache.provider, provider),
        eq(integrationCache.dataType, "data")
      )
    );

  if (existing) {
    await db
      .update(integrationCache)
      .set({
        data: JSON.stringify(data),
        fetchedAt: now,
        expiresAt,
      })
      .where(eq(integrationCache.id, existing.id));
  } else {
    await db.insert(integrationCache).values({
      id: createId(),
      provider,
      dataType: "data",
      data: JSON.stringify(data),
      fetchedAt: now,
      expiresAt,
    });
  }
}

async function main() {
  console.log("Seeding integration configs and cache...");

  // Upsert configs
  await upsertConfig("calendar");
  await upsertConfig("gmail");
  console.log("✓ Integration configs set (calendar, gmail)");

  // Upsert cache
  await upsertCache("calendar", calendarData);
  await upsertCache("gmail", gmailData);
  console.log("✓ Cache populated with calendar events and emails");

  console.log("Done! Refresh your Mission Control dashboard.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
