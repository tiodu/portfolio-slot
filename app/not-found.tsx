import Link from "next/link";

export default function NotFound() {
  return (
    <article className="shell case-study-page">
      <h1>Page not found</h1>
      <p className="summary">That address is not on this site.</p>
      <p className="back-link">
        <Link href="/">Back to the home page</Link>
      </p>
    </article>
  );
}
