import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/nonconformance-severity/$id')({
  component: NonconformanceSeverityDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function NonconformanceSeverityDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="nonconformance_severity" recordId={id} />;
}
