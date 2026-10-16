import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/loss-event-status/$id')({
  component: LossEventStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function LossEventStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="loss_event_status" recordId={id} />;
}
