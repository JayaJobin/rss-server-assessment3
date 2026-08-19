"use client";

import { FormEvent, useEffect, useState } from "react";
import { useToast } from "./ToastProvider";
import { addPost, deletePostBySlug } from "@/lib/apiClient";
import type { Post } from "@/types/post";
import styles from "./ManageFeeds.module.css";

interface PostWithId extends Post {
  id: number;
}

export default function ManagePosts() {
  const [posts, setPosts] = useState<PostWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  async function loadPosts() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts`);
      const data = await res.json();
      setPosts(data);
    } catch {
      setError("Could not load posts from the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Initial data fetch on mount — the standard "sync with an external
    // system" effect pattern described in the React docs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPosts();
  }, []);

  function slugify(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedAuthor = author.trim();
    const trimmedCategory = category.trim();
    const trimmedSummary = summary.trim();

    if (!trimmedTitle || !trimmedAuthor || !trimmedCategory || !trimmedSummary) {
      setError("All fields are required.");
      return;
    }

    try {
      await addPost({
        slug: `${slugify(trimmedTitle)}-${Date.now()}`,
        title: trimmedTitle,
        author: trimmedAuthor,
        category: trimmedCategory,
        summary: trimmedSummary,
        body: trimmedSummary,
      });
      setTitle("");
      setAuthor("");
      setCategory("");
      setSummary("");
      setError(null);
      showToast(`Added post "${trimmedTitle}"`);
      loadPosts();
    } catch {
      setError("Could not save the post to the server. Try again.");
    }
  }

  async function handleDelete(post: PostWithId) {
    try {
      await deletePostBySlug(post.id);
      showToast(`Removed post "${post.title}"`);
      loadPosts();
    } catch {
      setError("Could not remove the post from the server. Try again.");
    }
  }

  return (
    <section className={`card ${styles.panel}`} aria-labelledby="manage-posts-heading">
      <h2 id="manage-posts-heading">Manage posts</h2>
      <p className={styles.description}>
        Add or remove posts directly through the RSS Server API. Changes
        are saved to the database and appear immediately on the Feeds and
        RSS Client pages.
      </p>

      {loading ? (
        <p className={styles.emptyState}>Loading posts…</p>
      ) : posts.length === 0 ? (
        <p className={styles.emptyState}>No posts yet. Add one below.</p>
      ) : (
        <ul className={styles.list} role="list">
          {posts.map((post) => (
            <li key={post.id} className={styles.item}>
              <div className={styles.itemText}>
                <span className={styles.itemName}>{post.title}</span>
                <span className={styles.itemUrl}>
                  {post.author} · {post.category}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => handleDelete(post)}
                aria-label={`Remove post ${post.title}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className={styles.form} onSubmit={handleAdd} noValidate>
        <div className={styles.formRow}>
          <label className={styles.field} htmlFor="post-title">
            <span>Title</span>
            <input
              id="post-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. New Technology Trends"
            />
          </label>
          <label className={styles.field} htmlFor="post-author">
            <span>Author</span>
            <input
              id="post-author"
              type="text"
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              placeholder="e.g. Jaya"
            />
          </label>
        </div>
        <div className={styles.formRow}>
          <label className={styles.field} htmlFor="post-category">
            <span>Category</span>
            <input
              id="post-category"
              type="text"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="e.g. Announcements"
            />
          </label>
          <label className={styles.field} htmlFor="post-summary">
            <span>Summary</span>
            <input
              id="post-summary"
              type="text"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="Short description"
            />
          </label>
        </div>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary">
          Add post
        </button>
      </form>
    </section>
  );
}
