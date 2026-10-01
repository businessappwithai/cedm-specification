import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/invoice-status/$id')({
  component: InvoiceStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function InvoiceStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="invoice_status" recordId={id} />;
}
