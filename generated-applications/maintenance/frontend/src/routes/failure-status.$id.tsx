import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/failure-status/$id')({
  component: FailureStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function FailureStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="failure_status" recordId={id} />;
}
