import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/invoice-line-matching-status/$id')({
  component: InvoiceLineMatchingStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function InvoiceLineMatchingStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="invoice_line_matching_status" recordId={id} />;
}
