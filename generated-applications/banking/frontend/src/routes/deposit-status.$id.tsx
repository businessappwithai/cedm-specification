import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/deposit-status/$id')({
  component: DepositStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function DepositStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="deposit_status" recordId={id} />;
}
