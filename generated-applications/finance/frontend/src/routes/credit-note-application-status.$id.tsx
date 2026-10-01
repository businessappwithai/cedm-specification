import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/credit-note-application-status/$id')({
  component: CreditNoteApplicationStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function CreditNoteApplicationStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="credit_note_application_status" recordId={id} />;
}
