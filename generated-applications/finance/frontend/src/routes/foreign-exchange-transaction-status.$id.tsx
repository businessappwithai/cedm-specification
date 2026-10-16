import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/foreign-exchange-transaction-status/$id')({
  component: ForeignExchangeTransactionStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ForeignExchangeTransactionStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="foreign_exchange_transaction_status" recordId={id} />;
}
