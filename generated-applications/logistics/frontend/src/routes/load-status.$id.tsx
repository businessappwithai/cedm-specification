import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/load-status/$id')({
  component: LoadStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function LoadStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="load_status" recordId={id} />;
}
