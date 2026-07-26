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

  return (
    <>
      <div className="admin-head">
        <h1>卡密池</h1>
      </div>
      {cardProducts.length === 0 ? (
        <div className="admin-empty">
          还没有「卡密」发货方式的商品。先到「商品」里把某个商品的发货方式设为卡密池。
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
