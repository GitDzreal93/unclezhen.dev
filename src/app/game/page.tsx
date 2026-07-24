import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import GameClient from "./GameClient";
import "./game.css";

export const metadata: Metadata = {
  title: "房间漫游 · 臻叔",
  description: "扫地机器人房间漫游：扫光斑解锁站点传送卡。",
};

export default function GamePage() {
  return (
    <>
      <a className="skip" href="#game-main">跳到游戏</a>
      <SiteNav active="game" cta={{ href: "/home", label: "./home" }} />
      <GameClient />
      <SiteFooter />
    </>
  );
}
