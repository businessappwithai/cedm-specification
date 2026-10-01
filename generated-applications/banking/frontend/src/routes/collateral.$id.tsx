import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/collateral/$id')({
  component: CollateralDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function CollateralDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="collateral" recordId={id} />;
}
