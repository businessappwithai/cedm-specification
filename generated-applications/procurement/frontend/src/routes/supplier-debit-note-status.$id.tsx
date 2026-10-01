import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/supplier-debit-note-status/$id')({
  component: SupplierDebitNoteStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SupplierDebitNoteStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="supplier_debit_note_status" recordId={id} />;
}
