import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/profit-center/$id')({
  component: ProfitCenterDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ProfitCenterDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="profit_center" recordId={id} />;
}
