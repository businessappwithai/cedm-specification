import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/city/$id')({
  component: CityDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function CityDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="city" recordId={id} />;
}
