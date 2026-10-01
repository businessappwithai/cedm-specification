import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/corrective-action-action-type/$id')({
  component: CorrectiveActionActionTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function CorrectiveActionActionTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="corrective_action_action_type" recordId={id} />;
}
