import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/payment-term-due-date-basis/$id')({
  component: PaymentTermDueDateBasisDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function PaymentTermDueDateBasisDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="payment_term_due_date_basis" recordId={id} />;
}
