import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/profit-center-status/$id')({
  component: ProfitCenterStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ProfitCenterStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="profit_center_status" recordId={id} />;
}
