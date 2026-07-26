import { notFound } from "next/navigation";
import { getPost } from "@/lib/data";
import PostForm from "../PostForm";

export const dynamic = "force-dynamic";

export default async function EditPost({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();
  return <PostForm post={post} isNew={false} />;
}
