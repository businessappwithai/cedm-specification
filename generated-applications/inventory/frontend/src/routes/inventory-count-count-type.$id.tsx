import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/inventory-count-count-type/$id')({
  component: InventoryCountCountTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function InventoryCountCountTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="inventory_count_count_type" recordId={id} />;
}
