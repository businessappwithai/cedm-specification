import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/maintenance-plan/$id')({
  component: MaintenancePlanDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function MaintenancePlanDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="maintenance_plan" recordId={id} />;
}
