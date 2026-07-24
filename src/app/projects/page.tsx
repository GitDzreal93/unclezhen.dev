import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { getProjects } from "@/lib/data";
import ProjectsClient from "./ProjectsClient";
import "./projects.css";

export const metadata: Metadata = {
  title: "项目展示 · 臻叔",
  description: "交付案例与实验场。",
};

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await getProjects();
  return (
    <>
      <a className="skip" href="#main">跳到主要内容</a>
      <SiteNav active="projects" />
      <main id="main">
        <ProjectsClient projects={projects} />
      </main>
      <SiteFooter />
    </>
  );
}
