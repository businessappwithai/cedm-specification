import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/journal-entry-line/$id')({
  component: JournalEntryLineDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function JournalEntryLineDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="journal_entry_line" recordId={id} />;
}
