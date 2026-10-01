import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/loss-event/$id')({
  component: LossEventDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function LossEventDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="loss_event" recordId={id} />;
}
