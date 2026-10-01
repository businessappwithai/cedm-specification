import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/repair-estimate/$id')({
  component: RepairEstimateDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function RepairEstimateDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="repair_estimate" recordId={id} />;
}
