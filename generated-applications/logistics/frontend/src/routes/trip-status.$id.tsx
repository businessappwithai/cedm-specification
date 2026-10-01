import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/trip-status/$id')({
  component: TripStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function TripStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="trip_status" recordId={id} />;
}
