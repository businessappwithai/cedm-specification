import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/care-plan-status/$id')({
  component: CarePlanStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function CarePlanStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="care_plan_status" recordId={id} />;
}
