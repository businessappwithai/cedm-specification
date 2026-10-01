import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/foreign-exchange-transaction/$id')({
  component: ForeignExchangeTransactionDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ForeignExchangeTransactionDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="foreign_exchange_transaction" recordId={id} />;
}
