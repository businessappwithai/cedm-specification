import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/enrollment-status/$id')({
  component: EnrollmentStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function EnrollmentStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="enrollment_status" recordId={id} />;
}
