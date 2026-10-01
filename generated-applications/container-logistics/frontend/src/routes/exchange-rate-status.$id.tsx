import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/exchange-rate-status/$id')({
  component: ExchangeRateStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ExchangeRateStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="exchange_rate_status" recordId={id} />;
}
