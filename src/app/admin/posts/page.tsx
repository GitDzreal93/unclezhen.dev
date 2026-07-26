import Link from "next/link";
import { getPosts } from "@/lib/data";
import { deletePost } from "@/lib/admin";
import DeleteButton from "../DeleteButton";

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
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">标题</th>
                <th scope="col">日期</th>
                <th scope="col">标签</th>
                <th scope="col"><span className="sr-only">操作</span></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id}>
                  <td className="mono">{p.id}</td>
                  <td>{p.title}</td>
                  <td className="mono">{p.date}</td>
                  <td>{p.tags.join(" · ")}</td>
                  <td>
                    <div className="admin-actions">
                      <Link className="btn btn--ghost btn--sm" href={`/admin/posts/${p.id}`}>
                        编辑
                      </Link>
                      <DeleteButton id={p.id} action={deletePost} confirm={`删除文章「${p.title}」？`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
