import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/event/$id')({
  component: EventDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function EventDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="event" recordId={id} />;
}
