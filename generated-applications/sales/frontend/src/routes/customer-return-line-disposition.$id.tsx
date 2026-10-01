import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/customer-return-line-disposition/$id')({
  component: CustomerReturnLineDispositionDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function CustomerReturnLineDispositionDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="customer_return_line_disposition" recordId={id} />;
}
