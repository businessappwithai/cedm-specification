import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/business-transaction-status/$id')({
  component: BusinessTransactionStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function BusinessTransactionStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="business_transaction_status" recordId={id} />;
}
