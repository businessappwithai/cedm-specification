import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/product-variant/$id')({
  component: ProductVariantDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ProductVariantDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="product_variant" recordId={id} />;
}
