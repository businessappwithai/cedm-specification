import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/credit-note-status/$id')({
  component: CreditNoteStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function CreditNoteStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="credit_note_status" recordId={id} />;
}
