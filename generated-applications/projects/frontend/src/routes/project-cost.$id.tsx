import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/project-cost/$id')({
  component: ProjectCostDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ProjectCostDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="project_cost" recordId={id} />;
}
