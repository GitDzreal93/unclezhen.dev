import type { Metadata } from "next";
import LauncherStage from "@/components/LauncherStage";
import "./launcher.css";

export const metadata: Metadata = {
  title: "臻叔 · 站点导航",
  description: "臻叔个人站导航：首页 3D IP、博客、项目、课程与商店，右侧内嵌扫地机小游戏。",
};

export default function LauncherPage() {
  return (
    <>
      <a className="skip" href="#launcher">跳到导航</a>
      <main className="launch" id="launcher">
        <LauncherStage />
      </main>
    </>
  );
}
