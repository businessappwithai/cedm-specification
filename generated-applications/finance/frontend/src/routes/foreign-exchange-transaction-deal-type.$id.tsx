import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/foreign-exchange-transaction-deal-type/$id')({
  component: ForeignExchangeTransactionDealTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ForeignExchangeTransactionDealTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="foreign_exchange_transaction_deal_type" recordId={id} />;
}
