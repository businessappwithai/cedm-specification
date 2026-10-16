import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/payment-instruction-payment-method/$id')({
  component: PaymentInstructionPaymentMethodDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function PaymentInstructionPaymentMethodDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="payment_instruction_payment_method" recordId={id} />;
}
