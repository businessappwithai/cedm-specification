import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/warehouse-warehouse-type/$id')({
  component: WarehouseWarehouseTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function WarehouseWarehouseTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="warehouse_warehouse_type" recordId={id} />;
}
