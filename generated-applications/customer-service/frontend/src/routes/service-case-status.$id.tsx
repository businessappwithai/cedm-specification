import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/service-case-status/$id')({
  component: ServiceCaseStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ServiceCaseStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="service_case_status" recordId={id} />;
}
