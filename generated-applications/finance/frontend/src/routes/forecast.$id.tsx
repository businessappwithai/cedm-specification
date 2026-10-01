import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/forecast/$id')({
  component: ForecastDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ForecastDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="forecast" recordId={id} />;
}
