import { PrismaClient, ReportStatus, Severity } from "@prisma/client";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

function loadEnvFile(filename: string) {
  const filePath = resolve(process.cwd(), filename);
  if (!existsSync(filePath)) return;

  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const db = new PrismaClient();

const PLACEHOLDER_SCREENSHOT = (seed: string) =>
  `https://picsum.photos/seed/${seed}/1200/800`;

type SeedReport = {
  title: string;
  description: string;
  severity: Severity;
  status: ReportStatus;
  browser: string;
  os: string;
  device: string;
  screenshot?: boolean;
  hoursAgo: number;
};

type SeedProject = {
  name: string;
  websiteUrl: string;
  archived?: boolean;
  reports: SeedReport[];
};

const DEMO_PROJECTS: SeedProject[] = [
  {
    name: "Landing Page",
    websiteUrl: "https://stripe.com",
    reports: [
      {
        title: "Hero CTA misaligned on tablet",
        description: "The primary button overlaps the headline below 768px width.",
        severity: "HIGH",
        status: "OPEN",
        browser: "Chrome",
        os: "iPadOS",
        device: "Tablet",
        screenshot: true,
        hoursAgo: 0.5,
      },
      {
        title: "Pricing table horizontal scroll",
        description: "Users must scroll sideways to compare plans on mobile.",
        severity: "MEDIUM",
        status: "OPEN",
        browser: "Safari",
        os: "iOS",
        device: "Mobile",
        screenshot: true,
        hoursAgo: 5,
      },
      {
        title: "Footer social icons missing",
        description: "LinkedIn and GitHub icons do not render in dark mode.",
        severity: "LOW",
        status: "RESOLVED",
        browser: "Firefox",
        os: "Windows",
        device: "Desktop",
        screenshot: true,
        hoursAgo: 72,
      },
    ],
  },
  {
    name: "Marketing Site",
    websiteUrl: "https://vercel.com",
    reports: [
      {
        title: "Blog images fail to lazy-load",
        description: "Images below the fold stay blank until a hard refresh.",
        severity: "MEDIUM",
        status: "OPEN",
        browser: "Chrome",
        os: "macOS",
        device: "Desktop",
        screenshot: true,
        hoursAgo: 2,
      },
      {
        title: "Newsletter signup validation error",
        description: "Invalid email shows a generic server error instead of inline hint.",
        severity: "LOW",
        status: "IN_PROGRESS",
        browser: "Edge",
        os: "Windows",
        device: "Desktop",
        screenshot: false,
        hoursAgo: 26,
      },
    ],
  },
  {
    name: "App Dashboard",
    websiteUrl: "https://linear.app",
    reports: [
      {
        title: "Sidebar collapse state not persisted",
        description: "Refreshing the page always expands the sidebar again.",
        severity: "HIGH",
        status: "OPEN",
        browser: "Chrome",
        os: "Windows",
        device: "Desktop",
        screenshot: true,
        hoursAgo: 1,
      },
      {
        title: "Chart tooltip clipped at viewport edge",
        description: "Tooltips on the rightmost chart are cut off.",
        severity: "MEDIUM",
        status: "OPEN",
        browser: "Chrome",
        os: "macOS",
        device: "Desktop",
        screenshot: true,
        hoursAgo: 8,
      },
      {
        title: "Export CSV downloads empty file",
        description: "Reports export returns a 0-byte file for filtered views.",
        severity: "CRITICAL",
        status: "IN_PROGRESS",
        browser: "Firefox",
        os: "Linux",
        device: "Desktop",
        screenshot: true,
        hoursAgo: 12,
      },
      {
        title: "Avatar upload spinner never stops",
        description: "Profile photo upload hangs at 90% indefinitely.",
        severity: "HIGH",
        status: "CLOSED",
        browser: "Safari",
        os: "macOS",
        device: "Desktop",
        screenshot: false,
        hoursAgo: 120,
      },
    ],
  },
  {
    name: "Legacy Blog",
    websiteUrl: "https://medium.com",
    archived: true,
    reports: [
      {
        title: "RSS feed returns 404",
        description: "The /feed.xml endpoint was removed during migration.",
        severity: "LOW",
        status: "RESOLVED",
        browser: "Chrome",
        os: "Windows",
        device: "Desktop",
        screenshot: false,
        hoursAgo: 240,
      },
    ],
  },
];

function hoursAgoDate(hoursAgo: number) {
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
}

function apiKeyForOrg(organizationId: string, index: number) {
  const orgPart = organizationId.replace(/[^a-z0-9]/gi, "").slice(-16).padStart(16, "0");
  return `project_live_${orgPart}${String(index).padStart(2, "0")}`;
}

async function seedProjectsForOrg(organizationId: string, orgName: string) {
  for (const [index, seedProject] of DEMO_PROJECTS.entries()) {
    const apiKey = apiKeyForOrg(organizationId, index);

    const project = await db.project.upsert({
      where: { apiKey },
      update: {
        name: seedProject.name,
        websiteUrl: seedProject.websiteUrl,
        archived: seedProject.archived ?? false,
      },
      create: {
        name: seedProject.name,
        websiteUrl: seedProject.websiteUrl,
        archived: seedProject.archived ?? false,
        organizationId,
        apiKey,
      },
    });

    for (const report of seedProject.reports) {
      const exists = await db.report.findFirst({
        where: { projectId: project.id, title: report.title },
      });

      if (exists) continue;

      const screenshotSeed = `${project.id}-${report.title}`.replace(/\s+/g, "-").toLowerCase();

      const reportIndex = seedProject.reports.indexOf(report);

      await db.report.create({
        data: {
          projectId: project.id,
          title: report.title,
          description: report.description,
          severity: report.severity,
          status: report.status,
          screenshotUrl: report.screenshot ? PLACEHOLDER_SCREENSHOT(screenshotSeed) : null,
          pageUrl: seedProject.websiteUrl,
          browser: report.browser,
          os: report.os,
          device: report.device,
          screenWidth: 1440,
          screenHeight: 900,
          viewportWidth: report.device === "Mobile" ? 390 : 1280,
          viewportHeight: report.device === "Mobile" ? 844 : 800,
          createdAt: hoursAgoDate(report.hoursAgo),
          metadata: {
            issueNumber: reportIndex + 1,
            type: reportIndex % 2 === 0 ? "BUG" : "IMPROVEMENT",
            priority:
              report.severity === "CRITICAL"
                ? "URGENT"
                : report.severity === "HIGH"
                  ? "HIGH"
                  : report.severity === "MEDIUM"
                    ? "MEDIUM"
                    : report.severity === "LOW"
                      ? "LOW"
                      : "NONE",
            reporterName: "Demo User",
            assigneeIds: reportIndex % 3 === 0 ? ["demo-user-id"] : [],
          },
        },
      });
    }
  }

  console.log(`Seeded dummy projects for "${orgName}"`);
}

async function main() {
  const user = await db.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      id: "demo-user-id",
      name: "Demo User",
      email: "demo@example.com",
      emailVerified: true,
    },
  });

  const org = await db.organization.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      name: "Acme Corp",
      slug: "acme-corp",
      ownerId: user.id,
    },
  });

  await db.membership.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
    update: {},
    create: { userId: user.id, organizationId: org.id, role: "OWNER" },
  });

  const allOrgs = await db.organization.findMany({ select: { id: true, name: true } });

  for (const existingOrg of allOrgs) {
    await seedProjectsForOrg(existingOrg.id, existingOrg.name);
  }

  console.log("Seed complete — 4 projects with reports added per organization");
}

main().finally(() => db.$disconnect());
