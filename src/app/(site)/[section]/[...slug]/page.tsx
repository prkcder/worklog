import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { SECTIONS, type Section, getAllPosts, getPostContent } from "@/lib/content";

export const runtime = "nodejs";

export function generateStaticParams() {
  const params: { section: string; slug: string[] }[] = [];
  for (const section of SECTIONS) {
    for (const p of getAllPosts(section)) {
      params.push({ section, slug: p.slugParts });
    }
  }
  return params;
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ section: string; slug: string[] }>;
}) {
  const { section: sectionRaw, slug } = await params;

  const section = sectionRaw as Section;
  if (!SECTIONS.includes(section)) return notFound();

  const post = getPostContent(section, slug);
  if (!post) return notFound();

  return (
    <div>
      <h1>{post.meta.title}</h1>

      <div className="meta" style={{ marginTop: 8 }}>
        {post.meta.date ? post.meta.date : null}
        {post.meta.tags?.length ? ` • ${post.meta.tags.map((t) => `#${t}`).join(" ")}` : ""}
      </div>

      <article style={{ marginTop: 18 }}>
        <MDXRemote source={post.content} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
      </article>
    </div>
  );
}
