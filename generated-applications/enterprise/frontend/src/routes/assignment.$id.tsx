import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/assignment/$id')({
  component: AssignmentDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AssignmentDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="assignment" recordId={id} />;
}
