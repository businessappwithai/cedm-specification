import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/project-task-priority/$id')({
  component: ProjectTaskPriorityDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ProjectTaskPriorityDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="project_task_priority" recordId={id} />;
}
