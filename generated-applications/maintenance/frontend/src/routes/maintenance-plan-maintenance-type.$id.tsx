import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/maintenance-plan-maintenance-type/$id')({
  component: MaintenancePlanMaintenanceTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function MaintenancePlanMaintenanceTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="maintenance_plan_maintenance_type" recordId={id} />;
}
