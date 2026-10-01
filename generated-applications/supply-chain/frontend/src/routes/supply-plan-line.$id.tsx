import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/supply-plan-line/$id')({
  component: SupplyPlanLineDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SupplyPlanLineDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="supply_plan_line" recordId={id} />;
}
