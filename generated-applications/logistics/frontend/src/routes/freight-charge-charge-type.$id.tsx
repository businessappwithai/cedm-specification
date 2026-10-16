import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/freight-charge-charge-type/$id')({
  component: FreightChargeChargeTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function FreightChargeChargeTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="freight_charge_charge_type" recordId={id} />;
}
