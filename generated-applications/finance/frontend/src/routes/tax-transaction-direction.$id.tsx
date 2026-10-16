import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/tax-transaction-direction/$id')({
  component: TaxTransactionDirectionDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function TaxTransactionDirectionDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="tax_transaction_direction" recordId={id} />;
}
