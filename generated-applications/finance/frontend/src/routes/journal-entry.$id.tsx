import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/journal-entry/$id')({
  component: JournalEntryDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function JournalEntryDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="journal_entry" recordId={id} />;
}
