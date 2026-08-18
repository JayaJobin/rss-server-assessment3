"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./page.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL;


interface FeedStatusRow {
  feedSourceId: number | null;
  label: string;
  status: "ok" | "empty" | "error" | string;
  message: string | null;
  lastCheckedAt: string;
}

interface StatsResponse {
  health: string;
  totalFeedSources: number;
  totalPosts: number;
  totalApiRequests: number;
  totalLoggedRequests: number;
  uniqueClientCount: number;
  requestsPerFeed: { feedSourceId: number | null; feedName: string; count: number }[];
  requestsPerClient: { clientId: string; count: number }[];
  feedStatuses: FeedStatusRow[];
  generatedAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [host, setHost] = useState("");

  useEffect(() => {
    setHost(window.location.hostname);
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const [statsRes, healthRes] = await Promise.all([
        fetch(`${API_URL}/api/stats`, { cache: "no-store" }),
        fetch(`${API_URL}/api/health`, { cache: "no-store" }),
      ]);
      if (!statsRes.ok) throw new Error("Failed to load stats");
      const data: StatsResponse = await statsRes.json();
      setStats(data);
      setHealthOk(healthRes.ok);
      setLastRefreshed(new Date());
      setError(null);
    } catch {
      setHealthOk(false);
      setError("Could not reach the API. Check that the api service is running.");
    }
  }, []);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, [loadStats]);

  async function runSimulation() {
    setSimulating(true);
    try {
      await fetch(`${API_URL}/api/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts: 20, requestLogs: 80 }),
      });
      await loadStats();
    } catch {
      setError("Simulation request failed.");
    } finally {
      setSimulating(false);
    }
  }

  return (
    <div className={`container ${styles.wrap}`}>
      <header className={styles.head}>
        <div>
          <h1>Operational dashboard</h1>
          <p className={styles.lead}>
            Live health, request metrics and reporting for the RSS Server, sourced directly from
            the database.
          </p>
        </div>
        <button className={styles.simulateBtn} onClick={runSimulation} disabled={simulating}>
          {simulating ? "Simulating…" : "Generate simulated traffic"}
        </button>
      </header>

      {error && <div className={styles.alertError}>{error}</div>}



      <section className={styles.healthRow}>
        <StatusPill ok={healthOk} />
        {lastRefreshed && (
          <span className={styles.refreshedAt}>
            Last refreshed {lastRefreshed.toLocaleTimeString()} · auto-refreshes every 10s
          </span>
        )}
      </section>

      <section className={styles.panel}>
        <h2>Observability tools</h2>
        <p className={styles.empty}>
          Distributed traces and metrics for this app are also viewable directly
          in the underlying tools. Each link opens the relevant UI for this host.
        </p>
        <div className={styles.toolLinks}>
          <a href={`http://${host}:16686`} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
            Jaeger (traces)
          </a>
          <a href={`http://${host}:9411/zipkin`} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
            Zipkin (traces)
          </a>
          <a href={`http://${host}:9090`} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
            Prometheus (metrics)
          </a>
        </div>
      </section>

      

      <section className={styles.metricGrid}>
        <MetricCard label="Total requests" value={stats?.totalApiRequests ?? "—"} />
        <MetricCard label="Logged requests" value={stats?.totalLoggedRequests ?? "—"} />
        <MetricCard label="RSS feed count" value={stats?.totalFeedSources ?? "—"} />
        <MetricCard label="Total posts" value={stats?.totalPosts ?? "—"} />
        <MetricCard label="Unique clients" value={stats?.uniqueClientCount ?? "—"} />
      </section>

      <section className={styles.panelGrid}>
        <div className={styles.panel}>
          <h2>Requests per feed</h2>
          {stats && stats.requestsPerFeed.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Feed</th>
                  <th>Requests</th>
                </tr>
              </thead>
              <tbody>
                {stats.requestsPerFeed.map((row) => (
                  <tr key={row.feedSourceId ?? row.feedName}>
                    <td>{row.feedName}</td>
                    <td>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={styles.empty}>No feed requests logged yet. Try &quot;Generate simulated traffic&quot;.</p>
          )}
        </div>

        <div className={styles.panel}>
          <h2>Requests per client</h2>
          {stats && stats.requestsPerClient.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Client ID</th>
                  <th>Requests</th>
                </tr>
              </thead>
              <tbody>
                {stats.requestsPerClient.map((row) => (
                  <tr key={row.clientId}>
                    <td>{row.clientId}</td>
                    <td>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={styles.empty}>No client requests logged yet.</p>
          )}
        </div>
      </section>

      <section className={styles.panel}>
        <h2>Feed status</h2>
        {stats && stats.feedStatuses.length > 0 ? (
          <ul className={styles.statusList}>
            {stats.feedStatuses.map((f) => (
              <li key={f.feedSourceId ?? f.label} className={styles.statusItem}>
                <span className={`${styles.badge} ${styles[`badge_${f.status}`] ?? ""}`}>
                  {f.status.toUpperCase()}
                </span>
                <span className={styles.statusLabel}>{f.label}</span>
                {f.message && <span className={styles.statusMessage}>{f.message}</span>}
                <span className={styles.statusTime}>
                  checked {new Date(f.lastCheckedAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>
            No feed status recorded yet. Visit an RSS feed (e.g. /api/rss/Campus%20Announcements)
            or run the simulation above.
          </p>
        )}
      </section>
    </div>
  );
}

function StatusPill({ ok }: { ok: boolean | null }) {
  if (ok === null) {
    return <span className={`${styles.badge} ${styles.badge_checking}`}>CHECKING…</span>;
  }
  return (
    <span className={`${styles.badge} ${ok ? styles.badge_ok : styles.badge_error}`}>
      {ok ? "API HEALTHY (/api/health → 200 OK)" : "API UNREACHABLE"}
    </span>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className={styles.metricCard}>
      <span className={styles.metricValue}>{value}</span>
      <span className={styles.metricLabel}>{label}</span>
    </div>
  );
}
