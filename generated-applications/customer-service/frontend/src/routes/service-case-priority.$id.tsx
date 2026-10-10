import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/service-case-priority/$id')({
  component: ServiceCasePriorityDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ServiceCasePriorityDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="service_case_priority" recordId={id} />;
}
