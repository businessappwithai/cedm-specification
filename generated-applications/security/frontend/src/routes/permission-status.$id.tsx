import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/permission-status/$id')({
  component: PermissionStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function PermissionStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="permission_status" recordId={id} />;
}
