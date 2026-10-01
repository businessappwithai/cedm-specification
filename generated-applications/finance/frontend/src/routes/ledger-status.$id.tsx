import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/ledger-status/$id')({
  component: LedgerStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function LedgerStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="ledger_status" recordId={id} />;
}
