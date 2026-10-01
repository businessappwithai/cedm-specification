import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/maintenance-work-order-status/$id')({
  component: MaintenanceWorkOrderStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function MaintenanceWorkOrderStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="maintenance_work_order_status" recordId={id} />;
}
