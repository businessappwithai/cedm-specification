import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/sampling-rule-status/$id')({
  component: SamplingRuleStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SamplingRuleStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="sampling_rule_status" recordId={id} />;
}
