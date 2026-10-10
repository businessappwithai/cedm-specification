import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/gate-status/$id')({
  component: GateStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function GateStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="gate_status" recordId={id} />;
}
