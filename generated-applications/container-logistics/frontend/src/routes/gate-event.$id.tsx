import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/gate-event/$id')({
  component: GateEventDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function GateEventDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="gate_event" recordId={id} />;
}
