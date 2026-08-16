// Carousel displays featured posts with auto-advance, arrow keys, and dot navigation
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Post } from "@/types/post";
import styles from "./Carousel.module.css";

interface CarouselProps {
  posts: Post[];
  intervalMs?: number;
}

// A small, accessible carousel used on the Home page to highlight a
// handful of posts. Auto-advances on a timer, but pauses on hover/focus
// and stops entirely if the user prefers reduced motion. Fully keyboard
// operable (arrow keys move slides, Tab reaches the dot controls) and
// announces the current slide to screen readers via aria-live.
export default function Carousel({ posts, intervalMs = 5000 }: CarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const count = posts.length;

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % count) + count) % count);
    },
    [count]
  );

  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Auto-advance, respecting reduced-motion and the paused state.
  useEffect(() => {
    if (count <= 1) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion || paused) return;

    timerRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % count);
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [count, intervalMs, paused]);

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrev();
    }
  }

  if (count === 0) return null;

  const active = posts[index];

  return (
    <div
      className={styles.carousel}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured posts"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={onKeyDown}
    >
      <div className={styles.viewport}>
        <button
          type="button"
          className={styles.arrow}
          onClick={goPrev}
          aria-label="Previous featured post"
        >
          ‹
        </button>

        <div
          className={`card ${styles.slide}`}
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="eyebrow">{active.category}</p>
          <h3 className={styles.slideTitle}>{active.title}</h3>
          <p className={styles.slideSummary}>{active.summary}</p>
          <Link href={`/feeds/${active.slug}`} className={styles.slideLink}>
            Read this post →
          </Link>
        </div>

        <button
          type="button"
          className={styles.arrow}
          onClick={goNext}
          aria-label="Next featured post"
        >
          ›
        </button>
      </div>

      <div className={styles.dots} role="tablist" aria-label="Choose featured post">
        {posts.map((post, dotIndex) => (
          <button
            key={post.slug}
            type="button"
            role="tab"
            aria-selected={dotIndex === index}
            aria-label={`Show featured post ${dotIndex + 1}: ${post.title}`}
            className={`${styles.dot} ${dotIndex === index ? styles.dotActive : ""}`}
            onClick={() => goTo(dotIndex)}
          />
        ))}
      </div>
    </div>
  );
}