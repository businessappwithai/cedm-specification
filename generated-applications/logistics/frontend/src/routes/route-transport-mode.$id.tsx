import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/route-transport-mode/$id')({
  component: RouteTransportModeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function RouteTransportModeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="route_transport_mode" recordId={id} />;
}
