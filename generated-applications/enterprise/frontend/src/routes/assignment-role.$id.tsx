import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/assignment-role/$id')({
  component: AssignmentRoleDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AssignmentRoleDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="assignment_role" recordId={id} />;
}
