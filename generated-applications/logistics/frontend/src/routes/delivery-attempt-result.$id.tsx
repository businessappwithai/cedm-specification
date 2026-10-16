import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/delivery-attempt-result/$id')({
  component: DeliveryAttemptResultDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function DeliveryAttemptResultDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="delivery_attempt_result" recordId={id} />;
}
