import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/journal-entry-status/$id')({
  component: JournalEntryStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function JournalEntryStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="journal_entry_status" recordId={id} />;
}
