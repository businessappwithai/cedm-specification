import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/resource-assignment-status/$id')({
  component: ResourceAssignmentStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ResourceAssignmentStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="resource_assignment_status" recordId={id} />;
}
