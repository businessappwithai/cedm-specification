import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/project-cost-cost-type/$id')({
  component: ProjectCostCostTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ProjectCostCostTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="project_cost_cost_type" recordId={id} />;
}
