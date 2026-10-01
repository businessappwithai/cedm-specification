import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/exchange-rate-rate-type/$id')({
  component: ExchangeRateRateTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ExchangeRateRateTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="exchange_rate_rate_type" recordId={id} />;
}
