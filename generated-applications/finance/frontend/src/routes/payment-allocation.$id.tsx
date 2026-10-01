import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/payment-allocation/$id')({
  component: PaymentAllocationDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function PaymentAllocationDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="payment_allocation" recordId={id} />;
}
