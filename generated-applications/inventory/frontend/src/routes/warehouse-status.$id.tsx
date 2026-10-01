import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/warehouse-status/$id')({
  component: WarehouseStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function WarehouseStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="warehouse_status" recordId={id} />;
}
