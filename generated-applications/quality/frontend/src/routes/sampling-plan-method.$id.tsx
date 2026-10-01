import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/sampling-plan-method/$id')({
  component: SamplingPlanMethodDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SamplingPlanMethodDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="sampling_plan_method" recordId={id} />;
}
