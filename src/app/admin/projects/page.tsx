import Link from "next/link";
import { getProjects } from "@/lib/data";
import { deleteProject } from "@/lib/admin";
import DeleteButton from "../DeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminProjects() {
  const projects = await getProjects();
  return (
    <>
      <div className="admin-head">
        <h1>项目</h1>
        <Link className="btn btn--primary btn--sm" href="/admin/projects/new">
          + 新建项目
        </Link>
      </div>
      {projects.length === 0 ? (
        <div className="admin-empty">还没有项目。</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>名称</th>
              <th>类型</th>
              <th>年份</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id}>
                <td className="mono">{p.id}</td>
                <td>{p.name}</td>
                <td>{p.type}</td>
                <td className="mono">{p.year}</td>
                <td>
                  <div className="admin-actions">
                    <Link className="btn btn--ghost btn--sm" href={`/admin/projects/${p.id}`}>
                      编辑
                    </Link>
                    <DeleteButton id={p.id} action={deleteProject} confirm={`删除项目「${p.name}」？`} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
