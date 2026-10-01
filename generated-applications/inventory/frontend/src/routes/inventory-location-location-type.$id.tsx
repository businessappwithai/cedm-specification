import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/inventory-location-location-type/$id')({
  component: InventoryLocationLocationTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function InventoryLocationLocationTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="inventory_location_location_type" recordId={id} />;
}
