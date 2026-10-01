import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/yard-bay-status/$id')({
  component: YardBayStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function YardBayStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="yard_bay_status" recordId={id} />;
}
