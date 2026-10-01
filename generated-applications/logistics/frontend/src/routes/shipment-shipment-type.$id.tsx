import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/shipment-shipment-type/$id')({
  component: ShipmentShipmentTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ShipmentShipmentTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="shipment_shipment_type" recordId={id} />;
}
