import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/access-grant-status/$id')({
  component: AccessGrantStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AccessGrantStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="access_grant_status" recordId={id} />;
}
