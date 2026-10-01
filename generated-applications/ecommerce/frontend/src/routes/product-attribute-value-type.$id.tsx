import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/product-attribute-value-type/$id')({
  component: ProductAttributeValueTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ProductAttributeValueTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="product_attribute_value_type" recordId={id} />;
}
