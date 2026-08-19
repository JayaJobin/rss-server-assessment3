import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import WorkflowSteps from "@/components/WorkflowSteps";
import Carousel from "@/components/Carousel";
import RecentlyViewed from "@/components/RecentlyViewed";
import { getPosts } from "@/lib/apiServer";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await getPosts();
  const latest = posts.slice(-3).reverse();

  return (
    <>
      <section className={styles.hero}>
        <div className="container">
          <Breadcrumbs />
          <div className={styles.heroGrid}>
            <div>
              <p className="eyebrow">RSS Server → LMS</p>
              <h1 className={styles.heroTitle}>
                One quiet feed, carried from source to student.
              </h1>
              <p className={styles.heroLead}>
                This is the frontend for an RSS Server,
                an admin creates and categorises posts here, and the server
                sends them out to RSS clients such as the LMS, which simply
                display what they receive. Posts and feed sources shown
                here are now served live by the RSS Server backend.
              </p>
              <div className={styles.heroActions}>
                <Link href="/feeds" className="btn btn-primary">
                  Browse sample feed
                </Link>
                <Link href="/about" className="btn btn-outline">
                  About this project
                </Link>
              </div>
            </div>
            <PulseGraphic />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <p className="eyebrow">How the signal travels</p>
          <h2>From an admin&apos;s post to a student&apos;s screen</h2>
          <p className={styles.sectionLead}>
            Select a stage to see what it will be responsible for once the
            server is built.
          </p>
          <WorkflowSteps />
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.latestHead}>
            <div>
              <p className="eyebrow">Newest items</p>
              <h2>Recently published</h2>
            </div>
            <Link href="/feeds" className={styles.viewAll}>
              View all posts →
            </Link>
          </div>
          <ul className={styles.latestList} role="list">
            {latest.map((post) => (
              <li key={post.slug} className={`card ${styles.latestItem}`}>
                <p className={styles.latestCategory}>{post.category}</p>
                <h3 className={styles.latestTitle}>{post.title}</h3>
                <p className={styles.latestSummary}>{post.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <p className="eyebrow">Featured</p>
          <h2>A few posts worth a closer look</h2>
          <p className={styles.sectionLead}>
            Browse featured sample posts, or use the arrow keys once a slide
            is focused.
          </p>
          <Carousel posts={latest} intervalMs={2000} />
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <RecentlyViewed posts={posts} />
        </div>
      </section>
    </>
  );
}

function PulseGraphic() {
  return (
    <svg
      className={styles.pulseGraphic}
      viewBox="0 0 320 320"
      role="img"
      aria-label="Concentric signal rings representing a broadcast feed"
    >
      <circle cx="160" cy="160" r="10" fill="var(--accent-strong)" />
      <circle cx="160" cy="160" r="46" fill="none" stroke="var(--accent-strong)" strokeWidth="1.5" opacity="0.55" />
      <circle cx="160" cy="160" r="86" fill="none" stroke="var(--accent-strong)" strokeWidth="1.5" opacity="0.4" />
      <circle cx="160" cy="160" r="128" fill="none" stroke="var(--highlight)" strokeWidth="1.5" opacity="0.5" />
      <circle cx="160" cy="160" r="150" fill="none" stroke="var(--line)" strokeWidth="1" />
    </svg>
  );
}
