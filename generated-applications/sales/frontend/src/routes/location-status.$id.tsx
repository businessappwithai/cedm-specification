import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/location-status/$id')({
  component: LocationStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function LocationStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="location_status" recordId={id} />;
}
