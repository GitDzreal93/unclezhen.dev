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
        <div className="admin-empty">
          <div className="admin-empty__title">还没有项目</div>
          <p className="admin-empty__desc">新建一个项目来展示交付案例与实验。</p>
          <Link className="btn btn--primary btn--sm" href="/admin/projects/new">
            + 新建项目
          </Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">名称</th>
                <th scope="col">类型</th>
                <th scope="col">年份</th>
                <th scope="col"><span className="sr-only">操作</span></th>
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
        </div>
      )}
    </>
  );
}
