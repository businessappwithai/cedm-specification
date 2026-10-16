import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/pricing-status/$id')({
  component: PricingStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function PricingStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="pricing_status" recordId={id} />;
}
