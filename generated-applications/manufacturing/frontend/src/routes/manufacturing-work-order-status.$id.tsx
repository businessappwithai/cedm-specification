import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/manufacturing-work-order-status/$id')({
  component: ManufacturingWorkOrderStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ManufacturingWorkOrderStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="manufacturing_work_order_status" recordId={id} />;
}
