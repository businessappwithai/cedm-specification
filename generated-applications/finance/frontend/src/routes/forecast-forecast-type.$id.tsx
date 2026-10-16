import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/forecast-forecast-type/$id')({
  component: ForecastForecastTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ForecastForecastTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="forecast_forecast_type" recordId={id} />;
}
