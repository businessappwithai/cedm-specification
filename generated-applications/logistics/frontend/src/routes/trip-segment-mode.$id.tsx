import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/trip-segment-mode/$id')({
  component: TripSegmentModeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function TripSegmentModeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="trip_segment_mode" recordId={id} />;
}
