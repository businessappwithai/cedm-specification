import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/gate-gate-type/$id')({
  component: GateGateTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function GateGateTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="gate_gate_type" recordId={id} />;
}
