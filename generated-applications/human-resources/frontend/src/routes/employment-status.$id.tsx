import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/employment-status/$id')({
  component: EmploymentStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function EmploymentStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="employment_status" recordId={id} />;
}
