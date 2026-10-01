import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/trip-segment-status/$id')({
  component: TripSegmentStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function TripSegmentStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="trip_segment_status" recordId={id} />;
}
