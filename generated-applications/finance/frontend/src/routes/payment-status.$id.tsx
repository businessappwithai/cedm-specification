import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/payment-status/$id')({
  component: PaymentStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function PaymentStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="payment_status" recordId={id} />;
}
