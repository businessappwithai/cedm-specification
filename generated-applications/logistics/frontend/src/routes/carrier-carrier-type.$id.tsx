import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/carrier-carrier-type/$id')({
  component: CarrierCarrierTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function CarrierCarrierTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="carrier_carrier_type" recordId={id} />;
}
