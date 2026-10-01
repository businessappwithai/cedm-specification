import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/emission-emission-type/$id')({
  component: EmissionEmissionTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function EmissionEmissionTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="emission_emission_type" recordId={id} />;
}
