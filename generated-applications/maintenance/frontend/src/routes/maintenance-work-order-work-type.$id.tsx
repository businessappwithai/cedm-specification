import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/maintenance-work-order-work-type/$id')({
  component: MaintenanceWorkOrderWorkTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function MaintenanceWorkOrderWorkTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="maintenance_work_order_work_type" recordId={id} />;
}
