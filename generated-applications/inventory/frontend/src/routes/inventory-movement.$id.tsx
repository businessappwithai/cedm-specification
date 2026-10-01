import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/inventory-movement/$id')({
  component: InventoryMovementDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function InventoryMovementDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="inventory_movement" recordId={id} />;
}
