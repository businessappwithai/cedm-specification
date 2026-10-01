import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/supply-plan-line-status/$id')({
  component: SupplyPlanLineStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SupplyPlanLineStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="supply_plan_line_status" recordId={id} />;
}
