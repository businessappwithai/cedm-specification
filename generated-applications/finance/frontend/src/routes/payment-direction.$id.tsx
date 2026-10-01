import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/payment-direction/$id')({
  component: PaymentDirectionDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function PaymentDirectionDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="payment_direction" recordId={id} />;
}
