import ProductForm from "../ProductForm";

export default function NewProduct() {
  return (
    <>
      <div className="admin-head">
        <h1>新建商品</h1>
      </div>
      <ProductForm isNew />
    </>
  );
}
