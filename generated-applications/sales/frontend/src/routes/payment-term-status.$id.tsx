import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/payment-term-status/$id')({
  component: PaymentTermStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function PaymentTermStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="payment_term_status" recordId={id} />;
}
