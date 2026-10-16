import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/freight-charge-status/$id')({
  component: FreightChargeStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function FreightChargeStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="freight_charge_status" recordId={id} />;
}
