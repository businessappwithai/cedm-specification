import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/supplier-return-line-disposition/$id')({
  component: SupplierReturnLineDispositionDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SupplierReturnLineDispositionDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="supplier_return_line_disposition" recordId={id} />;
}
