import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/employment/$id')({
  component: EmploymentDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function EmploymentDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="employment" recordId={id} />;
}
