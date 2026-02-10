import Link from "next/link";
import { notFound } from "next/navigation";
import {
  SECTIONS,
  type Section,
  getAllPosts,
  getTagsForSection,
  getPostsByTag,
} from "@/lib/content";

export const runtime = "nodejs";

export function generateStaticParams() {
  return SECTIONS.map((section) => ({ section }));
}

export default async function SectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams?: Promise<{ tag?: string }> | { tag?: string };
}) {
  const { section: sectionRaw } = await params;
  const sp = await Promise.resolve(searchParams ?? {});

  const section = sectionRaw as Section;
  if (!SECTIONS.includes(section)) return notFound();

  const selectedTag = sp.tag ? decodeURIComponent(sp.tag) : null;

  const tags = getTagsForSection(section);
  const posts = selectedTag ? getPostsByTag(section, selectedTag) : getAllPosts(section);

  return (
    <div>
      <h1>{section.toUpperCase()}</h1>

      {tags.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div className="meta" style={{ marginBottom: 8 }}>
            Categories (tags)
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link
              href={`/${section}`}
              className="card"
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                textDecoration: "none",
                fontWeight: 800,
                opacity: selectedTag ? 0.75 : 1,
              }}
            >
              All
            </Link>

            {tags.map(({ tag, count }) => {
              const active = selectedTag?.toLowerCase() === tag;
              return (
                <Link
                  key={tag}
                  href={`/${section}?tag=${encodeURIComponent(tag)}`}
                  className="card"
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    textDecoration: "none",
                    fontWeight: 800,
                    opacity: active ? 1 : 0.8,
                  }}
                  title={`${count} posts`}
                >
                  {tag} <span className="meta">({count})</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <ul className="list" style={{ marginTop: 18 }}>
        {posts.map((p) => (
          <li key={p.slug} className="card">
            <Link
              href={`/${section}/${p.slug}`}
              style={{ fontWeight: 800, textDecoration: "none" }}
            >
              {p.meta.title}
            </Link>

            <div className="meta" style={{ marginTop: 6 }}>
              {p.meta.date ? p.meta.date : null}
              {p.meta.tags?.length ? ` • ${p.meta.tags.map((t) => `#${t}`).join(" ")}` : ""}
            </div>

            {p.meta.summary ? <p style={{ marginTop: 10 }}>{p.meta.summary}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
