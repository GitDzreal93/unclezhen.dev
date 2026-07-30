import Link from "next/link";
import { getPosts } from "@/lib/data";
import PostsTable from "./PostsTable";

export const dynamic = "force-dynamic";

export default async function AdminPosts() {
  const posts = await getPosts();
  return (
    <>
      <div className="admin-head">
        <h1>博客</h1>
        <Link className="btn btn--primary btn--sm" href="/admin/posts/new">
          + 新建文章
        </Link>
      </div>
      {posts.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty__title">还没有文章</div>
          <p className="admin-empty__desc">写第一篇文章，支持 Markdown 与富文本粘贴导入。</p>
          <Link className="btn btn--primary btn--sm" href="/admin/posts/new">
            + 新建文章
          </Link>
        </div>
      ) : (
        <PostsTable posts={posts} />
      )}
    </>
  );
}
