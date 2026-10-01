import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/corrective-action-status/$id')({
  component: CorrectiveActionStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function CorrectiveActionStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="corrective_action_status" recordId={id} />;
}
