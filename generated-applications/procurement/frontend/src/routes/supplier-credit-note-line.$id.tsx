import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/supplier-credit-note-line/$id')({
  component: SupplierCreditNoteLineDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SupplierCreditNoteLineDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="supplier_credit_note_line" recordId={id} />;
}
