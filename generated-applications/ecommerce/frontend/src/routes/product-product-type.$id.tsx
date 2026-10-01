import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/product-product-type/$id')({
  component: ProductProductTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ProductProductTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="product_product_type" recordId={id} />;
}
