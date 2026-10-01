import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/farm-farm-type/$id')({
  component: FarmFarmTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function FarmFarmTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="farm_farm_type" recordId={id} />;
}
