import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/gate-event-direction/$id')({
  component: GateEventDirectionDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function GateEventDirectionDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="gate_event_direction" recordId={id} />;
}
