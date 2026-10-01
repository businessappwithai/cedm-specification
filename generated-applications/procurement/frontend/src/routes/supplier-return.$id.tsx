import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/supplier-return/$id')({
  component: SupplierReturnDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SupplierReturnDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="supplier_return" recordId={id} />;
}
