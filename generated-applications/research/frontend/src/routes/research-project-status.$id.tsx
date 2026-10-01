import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/research-project-status/$id')({
  component: ResearchProjectStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ResearchProjectStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="research_project_status" recordId={id} />;
}
