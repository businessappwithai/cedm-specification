import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/workflow-status/$id')({
  component: WorkflowStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function WorkflowStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="workflow_status" recordId={id} />;
}
