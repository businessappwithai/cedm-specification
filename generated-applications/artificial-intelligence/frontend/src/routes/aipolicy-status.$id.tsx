import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/aipolicy-status/$id')({
  component: AIPolicyStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AIPolicyStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="ai_policy_status" recordId={id} />;
}
