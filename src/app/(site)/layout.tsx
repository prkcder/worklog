import Link from "next/link";
import { SECTIONS } from "@/lib/content";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="header">
        <nav className="nav">
          <Link href="/" className="brand">
            worklog
          </Link>

          <div className="links">
            {SECTIONS.map((s) => (
              <Link key={s} href={`/${s}`}>
                {s.toUpperCase()}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main className="container">{children}</main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} prkcder</span>
      </footer>
    </>
  );
}
