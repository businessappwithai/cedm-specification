import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/supply-plan-status/$id')({
  component: SupplyPlanStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SupplyPlanStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="supply_plan_status" recordId={id} />;
}
