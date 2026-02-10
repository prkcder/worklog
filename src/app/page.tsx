import Link from "next/link";
import { SECTIONS } from "@/lib/content";

export default function Home() {
  return (
    <main className="container">
      <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em" }}>
        worklog
      </h1>

      <p className="meta" style={{ marginTop: 10 }}>
        A public log of what I’m learning and building. Browse by section.
      </p>

      <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
        {SECTIONS.map((s) => (
          <Link
            key={s}
            href={`/${s}`}
            className="card"
            style={{ textDecoration: "none" }}
          >
            <div style={{ fontWeight: 800, fontSize: 18 }}>
              {s.toUpperCase()}
            </div>
            <div className="meta" style={{ marginTop: 6 }}>
              Open {s}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
