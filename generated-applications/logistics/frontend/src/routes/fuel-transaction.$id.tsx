import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/fuel-transaction/$id')({
  component: FuelTransactionDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function FuelTransactionDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="fuel_transaction" recordId={id} />;
}
