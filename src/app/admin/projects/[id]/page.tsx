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
      </div>
      <ProjectForm project={project} isNew={false} />
    </>
  );
}