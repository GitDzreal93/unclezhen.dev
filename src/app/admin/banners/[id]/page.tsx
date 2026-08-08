import { notFound } from "next/navigation";
import { getBanner } from "@/lib/data";
import BannerForm from "../BannerForm";

export const dynamic = "force-dynamic";

export default async function EditBanner({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const banner = await getBanner(id);
  if (!banner) notFound();
  return <BannerForm isNew={false} banner={banner} />;
}
