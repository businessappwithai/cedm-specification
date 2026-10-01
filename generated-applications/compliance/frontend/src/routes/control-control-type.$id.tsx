import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/control-control-type/$id')({
  component: ControlControlTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ControlControlTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="control_control_type" recordId={id} />;
}
