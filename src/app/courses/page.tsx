import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { getCourses } from "@/lib/data";
import CoursesClient from "./CoursesClient";
import "./courses.css";

export const metadata: Metadata = {
  title: "课程 · 臻叔",
  description: "面向开发者与想转产品交付的工程师的体系化课程。",
};

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const courses = await getCourses();
  return (
    <>
      <a className="skip" href="#main">跳到主要内容</a>
      <SiteNav active="courses" cta={{ href: "#catalog", label: "./enroll" }} />
      <main id="main">
        <CoursesClient courses={courses} />
      </main>
      <SiteFooter />
    </>
  );
}
