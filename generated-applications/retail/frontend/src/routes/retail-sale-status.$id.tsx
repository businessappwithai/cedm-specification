import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/retail-sale-status/$id')({
  component: RetailSaleStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function RetailSaleStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="retail_sale_status" recordId={id} />;
}
