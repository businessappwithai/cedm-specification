import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/consignment-transport-mode/$id')({
  component: ConsignmentTransportModeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ConsignmentTransportModeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="consignment_transport_mode" recordId={id} />;
}
