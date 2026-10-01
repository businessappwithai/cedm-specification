import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/repair-estimate-line/$id')({
  component: RepairEstimateLineDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function RepairEstimateLineDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="repair_estimate_line" recordId={id} />;
}
