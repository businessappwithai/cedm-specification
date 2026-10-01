import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/vehicle/$id')({
  component: VehicleDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function VehicleDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="vehicle" recordId={id} />;
}
