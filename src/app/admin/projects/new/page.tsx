import ProjectForm from "../ProjectForm";

export default function NewProject() {
  return (
    <>
      <div className="admin-head">
        <h1>新建项目</h1>
      </div>
      <ProjectForm isNew />
    </>
  );
}