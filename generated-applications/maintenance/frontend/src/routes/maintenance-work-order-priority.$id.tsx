import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/maintenance-work-order-priority/$id')({
  component: MaintenanceWorkOrderPriorityDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function MaintenanceWorkOrderPriorityDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="maintenance_work_order_priority" recordId={id} />;
}
