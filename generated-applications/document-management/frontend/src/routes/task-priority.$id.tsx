import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/task-priority/$id')({
  component: TaskPriorityDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function TaskPriorityDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="task_priority" recordId={id} />;
}
