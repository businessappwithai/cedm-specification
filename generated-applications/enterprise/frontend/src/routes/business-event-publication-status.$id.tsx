import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/business-event-publication-status/$id')({
  component: BusinessEventPublicationStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function BusinessEventPublicationStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="business_event_publication_status" recordId={id} />;
}
