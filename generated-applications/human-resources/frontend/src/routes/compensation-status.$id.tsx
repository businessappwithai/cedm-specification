import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/compensation-status/$id')({
  component: CompensationStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function CompensationStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="compensation_status" recordId={id} />;
}
