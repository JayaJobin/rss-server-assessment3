import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import RecentlyViewed from "@/components/RecentlyViewed";
import ManageFeeds from "@/components/ManageFeeds";
import ManagePosts from "@/components/ManagePosts";
import FeedList from "./FeedList";
import { getPosts } from "@/lib/apiServer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Feeds — RSS Server",
};

export default async function FeedsPage() {
  const posts = await getPosts();

  return (
    <div className="container">
      <Breadcrumbs />
      <div className="page-header">
        <p className="eyebrow">Live content</p>
        <h1>Posts published on this server</h1>
        <p>
          This list is fetched live from the RSS Server backend,
          representing the posts an admin has created and categorised on
          this server, ready to be sent to RSS clients. Filter by category,
          expand a card for a preview, or open a post for the full write-up.
        </p>
      </div>
      <ManageFeeds />
      <ManagePosts />
      <RecentlyViewed posts={posts} />
      <FeedList posts={posts} />
    </div>
  );
}
