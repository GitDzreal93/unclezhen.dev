import Link from "next/link";
import { getProjects } from "@/lib/data";
import ProjectsTable from "./ProjectsTable";

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
        <ProjectsTable projects={projects} />
      )}
    </>
  );
}
