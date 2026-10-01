import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/charge-status/$id')({
  component: ChargeStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ChargeStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="charge_status" recordId={id} />;
}
