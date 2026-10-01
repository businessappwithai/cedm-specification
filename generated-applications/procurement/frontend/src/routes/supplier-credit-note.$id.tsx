import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/supplier-credit-note/$id')({
  component: SupplierCreditNoteDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SupplierCreditNoteDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="supplier_credit_note" recordId={id} />;
}
