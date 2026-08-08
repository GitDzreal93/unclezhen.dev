import { notFound } from "next/navigation";
import { getSeries, getSeriesWithPosts, getPosts } from "@/lib/data";
import SeriesForm from "../SeriesForm";

export const dynamic = "force-dynamic";

export default async function EditSeries({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [series, seriesWithPosts, allPosts] = await Promise.all([
    getSeries(id),
    getSeriesWithPosts(id),
    getPosts(),
  ]);
  if (!series || !seriesWithPosts) notFound();
  return (
    <SeriesForm
      isNew={false}
      series={series}
      memberPosts={seriesWithPosts.posts}
      allPosts={allPosts}
    />
  );
}
