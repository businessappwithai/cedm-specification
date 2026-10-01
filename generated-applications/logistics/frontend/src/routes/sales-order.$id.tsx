import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/sales-order/$id')({
  component: SalesOrderDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SalesOrderDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="sales_order" recordId={id} />;
}
