import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/product-variant-status/$id')({
  component: ProductVariantStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ProductVariantStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="product_variant_status" recordId={id} />;
}
