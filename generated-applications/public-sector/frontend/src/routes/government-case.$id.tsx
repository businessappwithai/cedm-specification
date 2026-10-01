import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/government-case/$id')({
  component: GovernmentCaseDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function GovernmentCaseDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="government_case" recordId={id} />;
}
