import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/yard-status/$id')({
  component: YardStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function YardStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="yard_status" recordId={id} />;
}
