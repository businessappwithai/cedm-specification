import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/maintenance-plan-status/$id')({
  component: MaintenancePlanStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function MaintenancePlanStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="maintenance_plan_status" recordId={id} />;
}
