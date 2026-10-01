import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/inventory-transfer-status/$id')({
  component: InventoryTransferStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function InventoryTransferStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="inventory_transfer_status" recordId={id} />;
}
