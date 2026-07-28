import { getImages } from "@/lib/data";
import { imageUrl } from "@/lib/gh-image";
import CopyField from "./CopyField";

export const dynamic = "force-dynamic";

export default async function AdminMedia() {
  const images = await getImages();
  return (
    <>
      <div className="admin-head">
        <h1>媒体</h1>
      </div>
      {images.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty__title">还没有素材</div>
          <p className="admin-empty__desc">
            在文章编辑器里点「图片」上传，所有素材会汇总到这里，可复制链接用于文章、商品卡等。
          </p>
        </div>
      ) : (
        <div className="media-grid">
          {images.map((im) => {
            const url = imageUrl(im.host, im.path);
            return (
              <figure className="media-card" key={im.id}>
                <div className="media-card__img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={im.alt || im.filename}
                    loading="lazy"
                  />
                </div>
                <figcaption>
                  <div className="media-card__name mono" title={im.filename}>
                    {im.filename}
                  </div>
                  <div className="media-card__meta">
                    <span className="mono">{(im.bytes / 1024).toFixed(0)} KB</span>
                    <span>{im.contentType || "image"}</span>
                  </div>
                  <CopyField label="URL" value={url} />
                  <CopyField
                    label="MD"
                    value={`![${im.alt || im.filename}](${url})`}
                  />
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}
    </>
  );
}
