"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/*
  Targets: home scrolls to the top, work to the case study list. About and
  contact are placeholder sections on the home page until they get routes.
*/
const NAV = [
  { id: "home", label: "home", href: "/" },
  { id: "about", label: "about", href: "/#about" },
  { id: "work", label: "work", href: "/#case-studies" },
  { id: "contact", label: "contact", href: "/#contact" },
] as const;

type NavId = (typeof NAV)[number]["id"];

/** Which section is "current": the route on case-study pages, the scroll position on home. */
function useCurrentSection(pathname: string): NavId {
  const [section, setSection] = useState<NavId>("home");

  useEffect(() => {
    if (pathname !== "/") return;
    const ids: NavId[] = ["about", "work", "contact"];
    const target = (id: NavId) =>
      document.getElementById(id === "work" ? "case-studies" : id);
    const update = () => {
      // The last section whose top has passed the upper third of the viewport.
      let current: NavId = "home";
      for (const id of ids) {
        const el = target(id);
        if (el && el.getBoundingClientRect().top < window.innerHeight / 3) {
          current = id;
        }
      }
      setSection(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);

  if (pathname.startsWith("/work")) return "work";
  return section;
}

const FOCUSABLE = "a[href], button:not([disabled])";

export function SiteHeader() {
  const pathname = usePathname();
  const current = useCurrentSection(pathname);
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    menuButton.current?.focus();
  }, []);

  // While the panel is open: Escape closes it, Tab stays inside it.
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!panel.current.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Leaving the mobile layout while open would leave a stuck panel.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 48rem)");
    const onChange = () => query.matches && setOpen(false);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const links = NAV.map((item) => (
    <Link
      key={item.id}
      href={item.href}
      aria-current={current === item.id ? "location" : undefined}
      onClick={() => setOpen(false)}
    >
      {item.label}
    </Link>
  ));

  return (
    <header className="site-header">
      <Link
        href="/"
        className="site-name"
        aria-current={undefined}
        onClick={() => setOpen(false)}
      >
        Eduardo de Souza
      </Link>
      <nav className="site-nav" aria-label="Main">
        {links}
      </nav>
      <button
        ref={menuButton}
        type="button"
        className="pill site-menu-button"
        aria-expanded={open}
        aria-controls="site-menu-panel"
        onClick={() => setOpen(true)}
      >
        menu
      </button>
      {open ? (
        <div
          ref={panel}
          id="site-menu-panel"
          className="site-menu-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <nav aria-label="Main">{links}</nav>
          <button type="button" className="pill" onClick={close}>
            close
          </button>
        </div>
      ) : null}
    </header>
  );
}
