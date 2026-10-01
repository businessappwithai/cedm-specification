import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/aircraft/$id')({
  component: AircraftDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AircraftDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="aircraft" recordId={id} />;
}
