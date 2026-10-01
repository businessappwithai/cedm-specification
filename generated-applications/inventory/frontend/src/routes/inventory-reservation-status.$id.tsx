import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/inventory-reservation-status/$id')({
  component: InventoryReservationStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function InventoryReservationStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="inventory_reservation_status" recordId={id} />;
}
