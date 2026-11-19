import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell site-header-inner">
        <Link href="/" className="site-name">
          Eduardo de Souza
        </Link>
        <p className="site-role">
          Product Design Manager, iGaming UX. Moving into design engineering.
          Based in Ireland.
        </p>
      </div>
    </header>
  );
}
