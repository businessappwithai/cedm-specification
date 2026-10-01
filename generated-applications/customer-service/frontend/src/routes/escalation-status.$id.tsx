import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/escalation-status/$id')({
  component: EscalationStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function EscalationStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="escalation_status" recordId={id} />;
}
