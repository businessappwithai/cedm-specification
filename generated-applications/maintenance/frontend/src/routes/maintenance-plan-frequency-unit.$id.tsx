import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/maintenance-plan-frequency-unit/$id')({
  component: MaintenancePlanFrequencyUnitDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function MaintenancePlanFrequencyUnitDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="maintenance_plan_frequency_unit" recordId={id} />;
}
