import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/tax-transaction-status/$id')({
  component: TaxTransactionStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function TaxTransactionStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="tax_transaction_status" recordId={id} />;
}
