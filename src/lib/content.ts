import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export const SECTIONS = ["til", "notes", "recipes", "workouts"] as const;
export type Section = (typeof SECTIONS)[number];

export type Frontmatter = {
  title: string;
  date?: string; // YYYY-MM-DD recommended
  summary?: string;
  tags?: string[];
};

export type Post = {
  section: Section;
  slug: string;        // e.g. "my-post" or "go/slices"
  slugParts: string[];
  meta: Frontmatter;
};

const CONTENT_ROOT = path.join(process.cwd(), "content");

function sectionDir(section: Section) {
  return path.join(CONTENT_ROOT, section);
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  const files: string[] = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walk(p));
    else if (e.isFile() && (p.endsWith(".mdx") || p.endsWith(".md"))) files.push(p);
  }
  return files;
}

function readMeta(filePath: string): Frontmatter {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  const meta = parsed.data as Frontmatter;

  if (!meta?.title) throw new Error(`Missing required frontmatter "title" in: ${filePath}`);
  return meta;
}

function norm(s: string) {
  return (s ?? "").trim().toLowerCase();
}

export function getAllPosts(section: Section): Post[] {
  const dir = sectionDir(section);
  const files = walk(dir);

  const posts = files.map((filePath) => {
    const meta = readMeta(filePath);
    const rel = path.relative(dir, filePath);
    const slug = rel.replace(/\.(mdx|md)$/, "").split(path.sep).join("/");
    return { section, slug, slugParts: slug.split("/"), meta };
  });

  // Sort: date desc if present, otherwise title asc
  posts.sort((a, b) => {
    const ad = a.meta.date ?? "";
    const bd = b.meta.date ?? "";
    if (ad && bd) return ad < bd ? 1 : -1;
    if (ad && !bd) return -1;
    if (!ad && bd) return 1;
    return a.meta.title.localeCompare(b.meta.title);
  });

  return posts;
}

export function getTagsForSection(section: Section): { tag: string; count: number }[] {
  const posts = getAllPosts(section);
  const counts = new Map<string, number>();

  for (const p of posts) {
    for (const t of p.meta.tags ?? []) {
      const key = norm(t);
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function getPostsByTag(section: Section, tag: string) {
  const target = norm(tag);
  return getAllPosts(section).filter((p) =>
    (p.meta.tags ?? []).some((t) => norm(t) === target)
  );
}

export function getPostContent(section: Section, slugParts: string[]) {
  const base = sectionDir(section);
  const rel = slugParts.join(path.sep);

  const mdxPath = path.join(base, `${rel}.mdx`);
  const mdPath = path.join(base, `${rel}.md`);
  const filePath = fs.existsSync(mdxPath) ? mdxPath : fs.existsSync(mdPath) ? mdPath : null;

  if (!filePath) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  const meta = parsed.data as Frontmatter;

  if (!meta?.title) throw new Error(`Missing required frontmatter "title" in: ${filePath}`);
  return { meta, content: parsed.content };
}
