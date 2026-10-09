import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/entitlement-status/$id')({
  component: EntitlementStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function EntitlementStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="entitlement_status" recordId={id} />;
}
