"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { useClientStorage } from "./useClientStorage";
import { useToast } from "./ToastProvider";
import styles from "./Navbar.module.css";

interface NavLink {
  href: string;
  label: string;
}

const LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/feeds", label: "Feeds" },
  { href: "/rss-client", label: "RSS Client" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/about", label: "About" },
  { href: "/settings", label: "Settings" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [wasOpen, setWasOpen] = useClientStorage<boolean>("rss-server-menu-open", false);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  // Restore the last menu state once localStorage has hydrated, so the
  // demonstrated preference genuinely persists across reloads.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(wasOpen);
  }, [wasOpen]);

  useEffect(() => {
    setWasOpen(open);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on Escape, and return focus to the toggle button.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && open) {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Close the menu automatically after choosing a link on small screens.
  const closeOnNavigate = () => setOpen(false);

  return (
    <nav className={styles.navbar} aria-label="Primary">
      <div className={`${styles.inner} container`}>
        <Link href="/" className={styles.brand} aria-label="RSS Server home">
          <PulseMark />
          <span>RSS&nbsp;Server</span>
        </Link>

        <ul className={styles.links} role="list">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={active ? styles.activeLink : undefined}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className={styles.controls}>
          <button
            type="button"
            className={styles.themeToggle}
            onClick={() => {
              toggleTheme();
              showToast(`Switched to ${theme === "dark" ? "light" : "dark"} theme`);
            }}
            aria-pressed={theme === "dark"}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? "🌙" : "☀️"}
            <span className={styles.themeLabel}>
              {theme === "dark" ? "Dark" : "Light"}
            </span>
          </button>

          <button
            ref={toggleRef}
            type="button"
            className={`${styles.hamburger} ${open ? styles.hamburgerOpen : ""}`}
            aria-expanded={open}
            aria-controls="primary-mobile-menu"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => {
              const next = !open;
              setOpen(next);
              showToast(next ? "Menu opened" : "Menu closed");
            }}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <div
        id="primary-mobile-menu"
        ref={panelRef}
        className={`${styles.mobilePanel} ${open ? styles.mobilePanelOpen : ""}`}
        hidden={!open}
      >
        <ul role="list" className={styles.mobileLinks}>
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  onClick={closeOnNavigate}
                  className={active ? styles.activeLink : undefined}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

function PulseMark() {
  return (
    <svg
      className={styles.pulseMark}
      width="28"
      height="28"
      viewBox="0 0 28 28"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="14" cy="14" r="3.4" fill="currentColor" />
      <circle cx="14" cy="14" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.55" />
      <circle cx="14" cy="14" r="12.4" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.3" />
    </svg>
  );
}
