import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/warehouse-location-type/$id')({
  component: WarehouseLocationTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function WarehouseLocationTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="warehouse_location_type" recordId={id} />;
}
