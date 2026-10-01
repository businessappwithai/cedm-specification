import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/facility-facility-type/$id')({
  component: FacilityFacilityTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function FacilityFacilityTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="facility_facility_type" recordId={id} />;
}
