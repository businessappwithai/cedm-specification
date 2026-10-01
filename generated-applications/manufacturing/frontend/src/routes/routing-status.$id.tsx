import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/routing-status/$id')({
  component: RoutingStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function RoutingStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="routing_status" recordId={id} />;
}
