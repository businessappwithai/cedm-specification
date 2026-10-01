import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/customer-status/$id')({
  component: CustomerStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function CustomerStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="customer_status" recordId={id} />;
}
