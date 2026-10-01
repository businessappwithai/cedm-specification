import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/access-grant/$id')({
  component: AccessGrantDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AccessGrantDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="access_grant" recordId={id} />;
}
