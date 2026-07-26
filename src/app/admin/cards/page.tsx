import { getProducts, getCards } from "@/lib/data";
import CardsManager from "./CardsManager";

export const dynamic = "force-dynamic";

export default async function AdminCards({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  const products = await getProducts();
  const cardProducts = products.filter((x) => x.deliveryMode === "card");
  const selected = p || cardProducts[0]?.id || "";
  const cards = selected ? await getCards(selected) : [];
  const unused = cards.filter((c) => c.status === "unused").length;
  const sold = cards.length - unused;

  return (
    <>
      <div className="admin-head">
        <h1>卡密池</h1>
        {cardProducts.length > 0 && (
          <div className="admin-head__meta">
            <span>
              未售 <strong style={{ color: "var(--accent)" }}>{unused}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>已售 {sold}</span>
            <span aria-hidden="true">·</span>
            <span>共 {cards.length}</span>
          </div>
        )}
      </div>
      {cardProducts.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty__title">还没有卡密商品</div>
          <p className="admin-empty__desc">
            先到「商品」里把某个商品的发货方式设为卡密池，再回来批量导入卡密。
          </p>
        </div>
      ) : (
        <CardsManager
          products={cardProducts.map((x) => ({ id: x.id, name: x.name }))}
          selected={selected}
          cards={cards}
        />
      )}
    </>
  );
}
