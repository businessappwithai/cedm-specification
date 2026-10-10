import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/stop-stop-type/$id')({
  component: StopStopTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function StopStopTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="stop_stop_type" recordId={id} />;
}
