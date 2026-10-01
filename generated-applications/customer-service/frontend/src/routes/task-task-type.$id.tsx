import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/task-task-type/$id')({
  component: TaskTaskTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function TaskTaskTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="task_task_type" recordId={id} />;
}
