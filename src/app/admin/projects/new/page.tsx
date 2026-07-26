import Link from "next/link";
import ProjectForm from "../ProjectForm";

export default function NewProject() {
  return (
    <>
      <div className="admin-head">
        <h1>新建项目</h1>
        <div className="admin-head__meta">
          <Link className="btn btn--ghost btn--sm" href="/admin/projects">
            返回列表
          </Link>
        </div>
      </div>
      <ProjectForm isNew />
    </>
  );
}