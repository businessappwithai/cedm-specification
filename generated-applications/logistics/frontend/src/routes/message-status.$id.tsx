import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/message-status/$id')({
  component: MessageStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function MessageStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="message_status" recordId={id} />;
}
