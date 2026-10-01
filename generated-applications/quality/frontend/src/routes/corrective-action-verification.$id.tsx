import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/corrective-action-verification/$id')({
  component: CorrectiveActionVerificationDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function CorrectiveActionVerificationDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="corrective_action_verification" recordId={id} />;
}
