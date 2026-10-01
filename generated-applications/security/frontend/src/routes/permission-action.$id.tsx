import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/permission-action/$id')({
  component: PermissionActionDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function PermissionActionDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="permission_action" recordId={id} />;
}
