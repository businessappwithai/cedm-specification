import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/sales-order-status/$id')({
  component: SalesOrderStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SalesOrderStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="sales_order_status" recordId={id} />;
}
