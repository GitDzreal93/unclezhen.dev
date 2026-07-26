import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { getPosts } from "@/lib/data";
import { renderMarkdown } from "@/lib/markdown";
import BlogClient from "./BlogClient";
import "./blog.css";

export const metadata: Metadata = {
  title: "技术博客 · 臻叔",
  description: "工程实践、动效拆解与产品笔记。",
};

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await getPosts();
  // Render each post's Markdown body to sanitized HTML server-side so the
  // client bundle stays free of marked/DOMPurify and the output is safe to
  // inject via dangerouslySetInnerHTML.
  const rendered = posts.map((p) => ({ ...p, bodyHtml: renderMarkdown(p.body) }));
  return (
    <>
      <a className="skip" href="#main">跳到主要内容</a>
      <SiteNav active="blog" />
      <main id="main">
        <BlogClient posts={rendered} />
      </main>
      <SiteFooter />
    </>
  );
}
