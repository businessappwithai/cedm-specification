import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/incident-category/$id')({
  component: IncidentCategoryDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function IncidentCategoryDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="incident_category" recordId={id} />;
}
