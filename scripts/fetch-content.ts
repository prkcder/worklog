import fs from "node:fs/promises";
import path from "node:path";
import * as tar from "tar";

const OWNER = process.env.WORKLOG_CONTENT_OWNER;      // prkcder
const REPO = process.env.WORKLOG_CONTENT_REPO;        // worklog-content
const REF = process.env.WORKLOG_CONTENT_REF || "main";
const TOKEN = process.env.WORKLOG_CONTENT_TOKEN;

const DEST = path.join(process.cwd(), "content");

async function exists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function hasAnyMdx(dir: string): Promise<boolean> {
  if (!(await exists(dir))) return false;

  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (await hasAnyMdx(p)) return true;
    } else if (e.name.endsWith(".mdx") || e.name.endsWith(".md")) {
      return true;
    }
  }
  return false;
}

async function main() {
  // If token isn’t set, allow local builds only if content already exists.
  if (!TOKEN) {
    if (await hasAnyMdx(DEST)) {
      console.log("WORKLOG_CONTENT_TOKEN not set; using existing local ./content");
      return;
    }
    throw new Error("Missing WORKLOG_CONTENT_TOKEN and no local content found in ./content");
  }

  if (!OWNER || !REPO) throw new Error("Missing WORKLOG_CONTENT_OWNER or WORKLOG_CONTENT_REPO");

  const url = `https://api.github.com/repos/${OWNER}/${REPO}/tarball/${REF}`;
  console.log(`Fetching content: ${OWNER}/${REPO}@${REF}`);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "worklog-site",
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub download failed: ${res.status} ${res.statusText}\n${text}`);
  }

  const tmpDir = path.join(process.cwd(), ".tmp-content");
  const tgzPath = path.join(tmpDir, "content.tgz");

  await fs.rm(tmpDir, { recursive: true, force: true });
  await fs.mkdir(tmpDir, { recursive: true });

  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(tgzPath, buf);

  // Extract tarball -> creates a single top-level folder like prkcder-worklog-content-<sha>/
  await tar.x({ file: tgzPath, cwd: tmpDir });

  const extracted = await fs.readdir(tmpDir, { withFileTypes: true });
  const rootDir = extracted.find((d) => d.isDirectory() && !d.name.startsWith("."))?.name;
  if (!rootDir) throw new Error("Could not find extracted root folder.");

  const srcContentDir = path.join(tmpDir, rootDir, "content");
  if (!(await exists(srcContentDir))) {
    throw new Error(`Expected folder not found: ${srcContentDir}\nMake sure worklog-content has /content at repo root.`);
  }

  // Replace ./content with the private repo's /content
  await fs.rm(DEST, { recursive: true, force: true });
  await fs.cp(srcContentDir, DEST, { recursive: true });

  await fs.rm(tmpDir, { recursive: true, force: true });
  console.log("✅ Synced private content into ./content");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
