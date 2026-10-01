import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/retail-sale-line/$id')({
  component: RetailSaleLineDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function RetailSaleLineDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="retail_sale_line" recordId={id} />;
}
