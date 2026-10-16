import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/ledger-ledger-type/$id')({
  component: LedgerLedgerTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function LedgerLedgerTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="ledger_ledger_type" recordId={id} />;
}
