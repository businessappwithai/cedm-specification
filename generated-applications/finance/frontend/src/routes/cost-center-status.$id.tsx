import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/cost-center-status/$id')({
  component: CostCenterStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function CostCenterStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="cost_center_status" recordId={id} />;
}
