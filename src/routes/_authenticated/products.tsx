import { createFileRoute } from "@tanstack/react-router";
import { ProductCataloguePanel } from "@/components/products/ProductCataloguePanel";

export const Route = createFileRoute("/_authenticated/products")({
  head: () => ({ meta: [{ title: "Lynk Assistant — Products" }] }),
  component: ProductsPage,
});

function ProductsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <p className="text-sm text-muted-foreground">
          Your live AISLE storefront catalogue — used when Lynk Assistant answers product questions in
          Instagram DMs.
        </p>
      </header>
      <ProductCataloguePanel />
    </div>
  );
}
