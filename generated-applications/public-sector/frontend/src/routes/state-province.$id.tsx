import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/state-province/$id')({
  component: StateProvinceDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function StateProvinceDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="state_province" recordId={id} />;
}
