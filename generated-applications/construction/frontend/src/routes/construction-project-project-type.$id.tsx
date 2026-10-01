import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/construction-project-project-type/$id')({
  component: ConstructionProjectProjectTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ConstructionProjectProjectTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="construction_project_project_type" recordId={id} />;
}
