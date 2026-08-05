import { collectionGet, collectionPost } from "@/lib/content-route";
export const dynamic = "force-dynamic";
export const GET = (request: Request) => collectionGet(request, "projects");
export const POST = (request: Request) => collectionPost(request, "projects");
