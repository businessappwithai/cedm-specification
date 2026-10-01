import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/construction-project-status/$id')({
  component: ConstructionProjectStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ConstructionProjectStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="construction_project_status" recordId={id} />;
}
