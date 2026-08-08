import {
  DYNAMIC, seriesAuthorize, seriesErrorResponse, seriesRevalidate,
  readJson, str, seriesAuditStatus,
  apiJson, newRequestId, query, ContentApiError, writeApiAuditLog,
} from "@/lib/series-api";
import { getSeriesWithCounts } from "@/lib/data";

export const dynamic = "force-dynamic";
const ROUTE = "/api/v1/series";

export async function GET(req: Request) {
  const requestId = newRequestId();
  const auth = await seriesAuthorize(req, "series:read", ROUTE, requestId);
  if (!auth.ok) return auth.resp;
  const data = await getSeriesWithCounts();
  return apiJson(data, requestId, { meta: { count: data.length } });
}

export async function POST(req: Request) {
  const requestId = newRequestId();
  const auth = await seriesAuthorize(req, "series:write", ROUTE, requestId);
  if (!auth.ok) return auth.resp;
  try {
    const b = await readJson(req);
    const id = str(b.id, "id", true);
    const title = str(b.title, "title", true);
    const description = typeof b.description === "string" ? b.description : "";
    const sort = Number.isInteger(b.sort) ? b.sort : 0;
    const showNumber = typeof b.showNumber === "boolean" ? b.showNumber : false;
    try {
      await query(
        "INSERT INTO series (id,title,description,show_number,sort) VALUES ($1,$2,$3,$4,$5)",
        [id, title, description, showNumber, sort],
      );
    } catch (e: any) {
      if (e?.code === "23505") throw new ContentApiError("conflict", "ID 已存在");
      throw e;
    }
    await writeApiAuditLog({ tokenId: auth.tokenId, method: "POST", route: ROUTE, resourceId: id, statusCode: 201, requestId });
    seriesRevalidate();
    const rows = await query<any>(
      "SELECT id,title,description,show_number AS showNumber,sort FROM series WHERE id=$1",
      [id],
    );
    return apiJson(rows[0], requestId, { status: 201 });
  } catch (error) {
    const { status, failureCode } = seriesAuditStatus(error);
    await writeApiAuditLog({ tokenId: auth.tokenId, method: "POST", route: ROUTE, statusCode: status, requestId, failureCode });
    return seriesErrorResponse(error, requestId);
  }
}
