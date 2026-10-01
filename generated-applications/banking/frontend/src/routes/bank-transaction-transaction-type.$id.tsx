import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/bank-transaction-transaction-type/$id')({
  component: BankTransactionTransactionTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function BankTransactionTransactionTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="bank_transaction_transaction_type" recordId={id} />;
}
