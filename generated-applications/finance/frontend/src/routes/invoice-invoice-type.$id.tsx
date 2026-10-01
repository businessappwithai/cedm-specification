import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/invoice-invoice-type/$id')({
  component: InvoiceInvoiceTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function InvoiceInvoiceTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="invoice_invoice_type" recordId={id} />;
}
