import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/pricing-price-type/$id')({
  component: PricingPriceTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function PricingPriceTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="pricing_price_type" recordId={id} />;
}
