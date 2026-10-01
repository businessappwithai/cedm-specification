import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/location-location-type/$id')({
  component: LocationLocationTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function LocationLocationTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="location_location_type" recordId={id} />;
}
