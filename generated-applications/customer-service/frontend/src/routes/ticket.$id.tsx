import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/ticket/$id')({
  component: TicketDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function TicketDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="ticket" recordId={id} />;
}
