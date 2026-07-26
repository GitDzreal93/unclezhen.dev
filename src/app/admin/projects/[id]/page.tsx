import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/data";
import ProjectForm from "../ProjectForm";

export const dynamic = "force-dynamic";

export default async function EditProject({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  return (
    <>
      <div className="admin-head">
        <h1>编辑项目</h1>
        <div className="admin-head__meta">
          <span className="mono">{project.id}</span>
          <Link className="btn btn--ghost btn--sm" href="/admin/projects">
            返回列表
          </Link>
        </div>
      </div>
      <ProjectForm project={project} isNew={false} />
    </>
  );
}