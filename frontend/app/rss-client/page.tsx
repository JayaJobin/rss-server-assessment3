"use client";

import { useEffect, useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

interface RssItem {
  title: string;
  link: string;
  description: string;
  author: string;
  category: string;
  pubDate: string;
}

interface RawPostSummary {
  category?: string;
}

function parseRssXml(xmlText: string): RssItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");
  const items = Array.from(doc.querySelectorAll("item"));

  return items.map((item) => ({
    title: item.querySelector("title")?.textContent ?? "",
    link: item.querySelector("link")?.textContent ?? "",
    description: item.querySelector("description")?.textContent ?? "",
    author: item.querySelector("author")?.textContent ?? "",
    category: item.querySelector("category")?.textContent ?? "",
    pubDate: item.querySelector("pubDate")?.textContent ?? "",
  }));
}

export default function RssClientPage() {
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [category, setCategory] = useState("All");
  const [items, setItems] = useState<RssItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawXml, setRawXml] = useState("");

  const feedUrl =
    category === "All"
      ? `${API_BASE}/api/rss`
      : `${API_BASE}/api/rss/${encodeURIComponent(category)}`;

  // Load the list of categories that actually exist in the database
  useEffect(() => {
    let cancelled = false;

    async function fetchCategories() {
      try {
        const res = await fetch(`${API_BASE}/api/posts`);
        if (!res.ok) return;
        const posts: RawPostSummary[] = await res.json();
        const unique = Array.from(
          new Set(posts.map((p) => p.category).filter(Boolean))
        ) as string[];
        unique.sort((a, b) => a.localeCompare(b));
        if (!cancelled) setCategories(["All", ...unique]);
      } catch {
        // If this fails, "All" still works as a fallback
      }
    }

    fetchCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    async function fetchFeed() {
      try {
        const res = await fetch(feedUrl);
        if (!res.ok) throw new Error("Feed request failed");
        const xmlText = await res.text();
        if (cancelled) return;
        setRawXml(xmlText);
        setItems(parseRssXml(xmlText));
      } catch {
        if (!cancelled) setError("Could not reach the RSS Server's feed endpoint.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchFeed();
    return () => {
      cancelled = true;
    };
  }, [feedUrl]);

  return (
    <div className="container">
      <Breadcrumbs />
      <div className="page-header">
        <p className="eyebrow">RSS Client</p>
        <h1>Feed received from the RSS Server</h1>
        <p>
          This page acts as an RSS Client: it fetches{" "}
          <code>{feedUrl}</code> directly from the RSS Server backend
          and parses the raw RSS 2.0 XML in the browser, independent of the
          admin &quot;Feeds&quot; page. Categories below are loaded live from{" "}
          <code>/api/posts</code>, so a new category appears automatically
          once a post uses it.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={c === category ? "btn btn-outline" : "btn btn-outline"}
              aria-pressed={c === category}
              style={{ textTransform: "capitalize" }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading && <p>Loading feed from server…</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && (
        <>
          <p>Received {items.length} item(s) from the server.</p>
          <div style={{ display: "grid", gap: "1rem" }}>
            {items.map((item, index) => (
              <article key={index} className="card" style={{ padding: "1rem" }}>
                <p className="eyebrow">{item.category}</p>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
                <p>
                  By {item.author} · {new Date(item.pubDate).toLocaleDateString()}
                </p>
              </article>
            ))}
          </div>

          <details style={{ marginTop: "2rem" }}>
            <summary>View raw RSS XML received from the server</summary>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>{rawXml}</pre>
          </details>
        </>
      )}
    </div>
  );
}
