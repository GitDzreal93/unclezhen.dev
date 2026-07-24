import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { getProducts } from "@/lib/data";
import ShopClient from "./ShopClient";
import "./shop.css";

export const metadata: Metadata = {
  title: "商店 · 臻叔",
  description: "可直接购买的源码包、模板与小工具。",
};

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const products = await getProducts();
  return (
    <>
      <a className="skip" href="#main">跳到主要内容</a>
      <SiteNav active="shop" cta={{ href: "#products", label: "./shop" }} />
      <main id="main">
        <ShopClient products={products} />
      </main>
      <SiteFooter />
    </>
  );
}
