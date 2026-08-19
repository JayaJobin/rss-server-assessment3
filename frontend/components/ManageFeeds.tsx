"use client";

import { FormEvent, useEffect, useState } from "react";
import { useToast } from "./ToastProvider";
import { getFeedSources, addFeedSource, deleteFeedSource } from "@/lib/apiClient";
import type { FeedSource } from "@/types/feedSource";
import styles from "./ManageFeeds.module.css";

// Lets a visitor add or remove the RSS feed sources this server pulls
// from. Backed by the RSS Server API — reads and writes go to the
// live database instead of localStorage.
export default function ManageFeeds() {
  const [sources, setSources] = useState<FeedSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    getFeedSources()
      .then((data) => {
        if (!cancelled) setSources(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load feed sources from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function isValidUrl(value: string) {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedUrl = url.trim();

    if (!trimmedName || !trimmedUrl) {
      setError("Both a name and a feed URL are required.");
      return;
    }
    if (!isValidUrl(trimmedUrl)) {
      setError("Enter a valid feed URL, starting with http:// or https://");
      return;
    }
    if (sources.some((source) => source.url === trimmedUrl)) {
      setError("That feed URL has already been added.");
      return;
    }

    try {
      const newSource = await addFeedSource(trimmedName, trimmedUrl);
      setSources((current) => [...current, newSource]);
      setName("");
      setUrl("");
      setError(null);
      showToast(`Added feed "${trimmedName}"`);
    } catch {
      setError("Could not save the feed to the server. Try again.");
    }
  }

  async function handleDelete(source: FeedSource) {
    try {
      await deleteFeedSource(source.id);
      setSources((current) => current.filter((item) => item.id !== source.id));
      showToast(`Removed feed "${source.name}"`);
    } catch {
      setError("Could not remove the feed from the server. Try again.");
    }
  }

  return (
    <section className={`card ${styles.panel}`} aria-labelledby="manage-feeds-heading">
      <h2 id="manage-feeds-heading">Manage feeds</h2>
      <p className={styles.description}>
        Add or remove the feed sources this server pulls posts from. Backed
        by the RSS Server API — changes are saved to the database.
      </p>

      {loading ? (
        <p className={styles.emptyState}>Loading feed sources…</p>
      ) : sources.length === 0 ? (
        <p className={styles.emptyState}>No feed sources yet. Add one below.</p>
      ) : (
        <ul className={styles.list} role="list">
          {sources.map((source) => (
            <li key={source.id} className={styles.item}>
              <div className={styles.itemText}>
                <span className={styles.itemName}>{source.name}</span>
                <span className={styles.itemUrl}>{source.url}</span>
              </div>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => handleDelete(source)}
                aria-label={`Remove feed ${source.name}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className={styles.form} onSubmit={handleAdd} noValidate>
        <div className={styles.formRow}>
          <label className={styles.field} htmlFor="feed-name">
            <span>Feed name</span>
            <input
              id="feed-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Careers Blog"
            />
          </label>
          <label className={styles.field} htmlFor="feed-url">
            <span>Feed URL</span>
            <input
              id="feed-url"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com/feed.xml"
            />
          </label>
        </div>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary">
          Add feed
        </button>
      </form>
    </section>
  );
}
