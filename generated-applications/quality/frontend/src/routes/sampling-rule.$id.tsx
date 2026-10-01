import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/sampling-rule/$id')({
  component: SamplingRuleDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SamplingRuleDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="sampling_rule" recordId={id} />;
}
