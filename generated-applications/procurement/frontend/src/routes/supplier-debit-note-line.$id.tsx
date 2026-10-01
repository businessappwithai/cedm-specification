import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/supplier-debit-note-line/$id')({
  component: SupplierDebitNoteLineDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SupplierDebitNoteLineDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="supplier_debit_note_line" recordId={id} />;
}
