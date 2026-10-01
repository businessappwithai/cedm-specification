import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/policy-status/$id')({
  component: PolicyStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function PolicyStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="policy_status" recordId={id} />;
}
