import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/trip-segment/$id')({
  component: TripSegmentDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function TripSegmentDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="trip_segment" recordId={id} />;
}
