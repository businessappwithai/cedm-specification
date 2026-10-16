import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/bank-reconciliation-status/$id')({
  component: BankReconciliationStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function BankReconciliationStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="bank_reconciliation_status" recordId={id} />;
}
