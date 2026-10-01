import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/repair-estimate-status/$id')({
  component: RepairEstimateStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function RepairEstimateStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="repair_estimate_status" recordId={id} />;
}
