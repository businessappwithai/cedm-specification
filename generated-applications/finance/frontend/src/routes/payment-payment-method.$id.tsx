import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/payment-payment-method/$id')({
  component: PaymentPaymentMethodDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function PaymentPaymentMethodDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="payment_payment_method" recordId={id} />;
}
